/**
 * Reports API Routes
 */
import express from 'express';
import { reportQueries, proposalQueries } from '../database/db.js';
import { verifyReport, calculatePayment } from '../services/ai-verification-service.js';
import { publishAsset, getDKGExplorerURL } from '../services/dkg-service.js';
import { reportToJSONLD } from '../utils/jsonld-generator.js';

const router = express.Router();

/**
 * GET /api/reports
 * Get all reports
 */
router.get('/', (req, res) => {
  try {
    const reports = reportQueries.getAll();

    res.json({
      success: true,
      count: reports.length,
      data: reports.map(r => ({
        ...r,
        jsonld_data: r.jsonld_data ? JSON.parse(r.jsonld_data) : null,
        verification_issues: r.verification_issues ? JSON.parse(r.verification_issues) : null
      }))
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/reports/proposal/:index
 * Get all reports for a specific proposal
 */
router.get('/proposal/:index', (req, res) => {
  try {
    const index = parseInt(req.params.index);
    const reports = reportQueries.getByProposal(index);

    res.json({
      success: true,
      count: reports.length,
      data: reports.map(r => ({
        ...r,
        jsonld_data: r.jsonld_data ? JSON.parse(r.jsonld_data) : null,
        verification_issues: r.verification_issues ? JSON.parse(r.verification_issues) : null
      }))
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/reports/submit
 * Submit a new report for verification
 */
router.post('/submit', async (req, res) => {
  try {
    const { referendum_index, submitter_wallet, report_jsonld } = req.body;

    // Validation
    if (!referendum_index || !submitter_wallet || !report_jsonld) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: referendum_index, submitter_wallet, report_jsonld'
      });
    }

    // Check if proposal exists
    const proposal = proposalQueries.getByIndex(referendum_index);
    if (!proposal) {
      return res.status(404).json({
        success: false,
        error: 'Proposal not found'
      });
    }

    // Check if proposal has UAL (required for report submission)
    if (!proposal.ual) {
      return res.status(400).json({
        success: false,
        error: 'Proposal must be published to DKG before reports can be submitted'
      });
    }

    // Validate JSON-LD format
    let jsonldData;
    try {
      jsonldData = typeof report_jsonld === 'string' ? JSON.parse(report_jsonld) : report_jsonld;

      // Check for required JSON-LD fields
      if (!jsonldData['@context'] || !jsonldData['@type']) {
        return res.status(400).json({
          success: false,
          error: 'Invalid JSON-LD: missing @context or @type'
        });
      }
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid JSON: ' + parseError.message
      });
    }

    // Calculate payment
    const jsonldString = JSON.stringify(jsonldData);
    const dataSize = Buffer.byteLength(jsonldString, 'utf8');
    const requiredPayment = calculatePayment(dataSize);

    // Extract report name from JSON-LD
    const reportName = jsonldData['schema:name'] || jsonldData.name || 'Untitled Report';

    // Store report in database
    const reportData = {
      referendum_index,
      submitter_wallet,
      report_name: reportName,
      jsonld_data: jsonldString,
      data_size_bytes: dataSize,
      required_payment_trac: requiredPayment,
      payment_address: process.env.PAYMENT_WALLET || '0x...'
    };

    const result = reportQueries.insert(reportData);
    const reportId = result.lastInsertRowid;

    console.log(`📝 Report submitted (ID: ${reportId}) for Referendum #${referendum_index}`);

    res.json({
      success: true,
      message: 'Report submitted successfully',
      report: {
        report_id: reportId,
        referendum_index,
        submitter_wallet,
        report_name: reportName,
        data_size_kb: (dataSize / 1024).toFixed(2),
        required_payment_trac: requiredPayment,
        payment_address: reportData.payment_address,
        verification_status: 'pending'
      },
      next_steps: [
        'Payment verification (simulated for MVP)',
        'AI verification will be triggered',
        'If approved, report will be published to DKG'
      ]
    });

  } catch (error) {
    console.error('Error submitting report:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/reports/:id/verify
 * Trigger AI verification for a report
 */
router.post('/:id/verify', async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const reports = reportQueries.getAll();
    const report = reports.find(r => r.report_id === reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    // Get proposal data
    const proposal = proposalQueries.getByIndex(report.referendum_index);
    const proposalData = JSON.parse(proposal.proposal_data);

    console.log(`🤖 Verifying report #${reportId}...`);

    // Run AI verification
    const verification = await verifyReport(
      proposalData,
      report.jsonld_data,
      report.referendum_index
    );

    console.log('✅ Verification result:', verification);

    // Update report with verification results
    const status = verification.valid && verification.confidence >= parseFloat(process.env.AI_VERIFICATION_THRESHOLD || '0.7')
      ? 'verified'
      : 'rejected';

    reportQueries.updateVerification(
      reportId,
      status,
      verification.confidence,
      verification.reasoning,
      verification.issues
    );

    res.json({
      success: true,
      verification: {
        status,
        valid: verification.valid,
        confidence: verification.confidence,
        reasoning: verification.reasoning,
        issues: verification.issues
      }
    });

  } catch (error) {
    console.error('Error verifying report:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/reports/:id/publish
 * Publish a verified report to DKG
 */
router.post('/:id/publish', async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const reports = reportQueries.getAll();
    const report = reports.find(r => r.report_id === reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    // Check if already published
    if (report.report_ual) {
      return res.status(400).json({
        success: false,
        error: 'Report already published to DKG',
        ual: report.report_ual
      });
    }

    // Check if verified
    if (report.verification_status !== 'verified') {
      return res.status(400).json({
        success: false,
        error: 'Report must be verified before publishing'
      });
    }

    // Get proposal to get parent UAL
    const proposal = proposalQueries.getByIndex(report.referendum_index);

    // Convert to JSON-LD with linkage
    const jsonld = reportToJSONLD(report, proposal.ual);

    console.log(`📤 Publishing report #${reportId} to DKG...`);

    // Publish to DKG
    const result = await publishAsset(jsonld, {
      sourceId: `report-${reportId}`,
      reportId: reportId,
      referendumIndex: report.referendum_index
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to publish to DKG: ' + result.error
      });
    }

    // Update database
    const explorerUrl = result.ual ? getDKGExplorerURL(result.ual) : null;

    reportQueries.updateDKGPublication(
      reportId,
      result.ual,
      result.id,
      null,
      explorerUrl
    );

    res.json({
      success: true,
      message: 'Report published to DKG',
      dkg: {
        id: result.id,
        status: result.status,
        ual: result.ual,
        explorer_url: explorerUrl
      }
    });

  } catch (error) {
    console.error('Error publishing report:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
