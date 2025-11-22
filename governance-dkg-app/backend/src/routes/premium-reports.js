/**
 * Premium Reports API Routes with X402 Payment Integration
 */

import express from 'express';
import { reportQueries, premiumAccessQueries, ualMappingQueries, proposalQueries } from '../database/db.js';
import {
  generatePaymentMessage,
  processPremiumAccess,
  getPremiumReportContent,
  checkUserAccess
} from '../services/x402-payment-service.js';
import {
  authenticateWallet,
  optionalAuthenticateWallet,
  requireAdmin,
  generateAuthMessage
} from '../middleware/auth.js';
import { verifyReport } from '../services/ai-verification-service.js';
import { publishAssetDirect } from '../services/dkg-direct-service.js';
import { reportToJSONLD } from '../utils/jsonld-generator.js';

const router = express.Router();

/**
 * GET /api/premium-reports/auth-message/:wallet
 * Generate authentication message for wallet signing
 */
router.get('/auth-message/:wallet', (req, res) => {
  try {
    const { wallet } = req.params;
    const message = generateAuthMessage(wallet);

    res.json({
      success: true,
      message,
      wallet
    });
  } catch (error) {
    console.error('Error generating auth message:', error);
    res.status(500).json({
      error: 'Failed to generate authentication message',
      details: error.message
    });
  }
});

/**
 * GET /api/premium-reports/proposal/:index
 * Get all premium reports for a proposal
 */
router.get('/proposal/:index', optionalAuthenticateWallet, (req, res) => {
  try {
    const referendumIndex = parseInt(req.params.index);
    const userWallet = req.userWallet;

    const reports = reportQueries.getPremiumByProposal(referendumIndex);

    // Filter out content for reports user doesn't have access to
    const filteredReports = reports.map(report => {
      if (!userWallet || !checkUserAccess(report.report_id, userWallet)) {
        // User doesn't have access, return only metadata
        return {
          report_id: report.report_id,
          report_name: report.report_name,
          referendum_index: report.referendum_index,
          author_type: report.author_type,
          premium_price_trac: report.premium_price_trac,
          data_size_bytes: report.data_size_bytes,
          verification_status: report.verification_status,
          report_ual: report.report_ual,
          submitted_at: report.submitted_at,
          has_access: false,
          payment_required: true
        };
      } else {
        // User has access, return full report
        return {
          ...report,
          has_access: true,
          payment_required: false
        };
      }
    });

    res.json({
      success: true,
      reports: filteredReports,
      count: filteredReports.length
    });
  } catch (error) {
    console.error('Error fetching premium reports:', error);
    res.status(500).json({
      error: 'Failed to fetch premium reports',
      details: error.message
    });
  }
});

/**
 * GET /api/premium-reports/:id
 * Get a specific premium report (requires payment if premium)
 */
router.get('/:id', optionalAuthenticateWallet, (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const userWallet = req.userWallet;

    if (!userWallet) {
      // No authentication provided, check if it's premium
      const report = reportQueries.getById(reportId);
      if (report && report.is_premium) {
        return res.status(402).json({
          success: false,
          error: 'Payment required',
          message: 'This is a premium report. Please authenticate and pay to access.',
          paymentRequired: true,
          reportId: report.report_id,
          reportName: report.report_name,
          price: report.premium_price_trac,
          currency: 'TRAC'
        });
      }
    }

    const result = getPremiumReportContent(reportId, userWallet);

    if (result.statusCode === 402) {
      return res.status(402).json(result);
    }

    if (!result.success) {
      return res.status(result.statusCode || 500).json(result);
    }

    res.json({
      success: true,
      report: result.report
    });
  } catch (error) {
    console.error('Error fetching premium report:', error);
    res.status(500).json({
      error: 'Failed to fetch premium report',
      details: error.message
    });
  }
});

/**
 * POST /api/premium-reports/submit
 * Submit a new premium report (requires authentication)
 */
router.post('/submit', authenticateWallet, async (req, res) => {
  try {
    const {
      referendum_index,
      report_name,
      jsonld_data,
      is_premium,
      premium_price_trac
    } = req.body;

    const userWallet = req.userWallet;

    // Validate required fields
    if (!referendum_index || !jsonld_data) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['referendum_index', 'jsonld_data']
      });
    }

    // Check if proposal exists
    const proposal = proposalQueries.getByIndex(referendum_index);
    if (!proposal) {
      return res.status(404).json({
        error: 'Proposal not found'
      });
    }

    // Validate premium fields
    if (is_premium && !premium_price_trac) {
      return res.status(400).json({
        error: 'Premium reports must have a price (premium_price_trac)'
      });
    }

    // Parse JSON-LD
    let parsedData;
    try {
      parsedData = typeof jsonld_data === 'string' ? JSON.parse(jsonld_data) : jsonld_data;
    } catch (error) {
      return res.status(400).json({
        error: 'Invalid JSON-LD format',
        details: error.message
      });
    }

    // Calculate data size
    const dataSize = Buffer.byteLength(JSON.stringify(parsedData), 'utf8');

    // Check if user is admin (for author_type)
    const adminAddresses = (process.env.ADMIN_ADDRESSES || '')
      .split(',')
      .map(addr => addr.trim().toLowerCase())
      .filter(addr => addr);
    const isAdmin = adminAddresses.includes(userWallet.toLowerCase());
    const authorType = isAdmin ? 'admin' : 'community';

    // Insert report
    const result = reportQueries.insert({
      referendum_index,
      submitter_wallet: userWallet,
      report_name: report_name || `Premium Report ${Date.now()}`,
      jsonld_data: JSON.stringify(parsedData),
      data_size_bytes: dataSize,
      required_payment_trac: 0, // No submission fee for premium reports
      payment_address: null,
      is_premium: is_premium ? 1 : 0,
      premium_price_trac: is_premium ? premium_price_trac : null,
      author_type: authorType
    });

    const reportId = result.lastInsertRowid;

    // Trigger AI verification
    try {
      const verificationResult = await verifyReport(reportId);
      console.log(`AI Verification for report ${reportId}:`, verificationResult);
    } catch (verifyError) {
      console.error('AI verification failed:', verifyError);
    }

    res.status(201).json({
      success: true,
      message: 'Premium report submitted successfully',
      reportId,
      is_premium,
      author_type: authorType,
      verification_pending: true
    });
  } catch (error) {
    console.error('Error submitting premium report:', error);
    res.status(500).json({
      error: 'Failed to submit premium report',
      details: error.message
    });
  }
});

/**
 * POST /api/premium-reports/:id/publish
 * Publish verified premium report to DKG
 */
router.post('/:id/publish', authenticateWallet, async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const userWallet = req.userWallet;

    const report = reportQueries.getById(reportId);

    if (!report) {
      return res.status(404).json({
        error: 'Report not found'
      });
    }

    // Check ownership
    if (report.submitter_wallet.toLowerCase() !== userWallet.toLowerCase()) {
      return res.status(403).json({
        error: 'You can only publish your own reports'
      });
    }

    // Check if already published
    if (report.report_ual) {
      return res.status(400).json({
        error: 'Report already published to DKG',
        ual: report.report_ual
      });
    }

    // Check verification status
    if (report.verification_status !== 'verified') {
      return res.status(400).json({
        error: 'Report must be verified before publishing',
        current_status: report.verification_status
      });
    }

    // Get parent proposal
    const proposal = proposalQueries.getByIndex(report.referendum_index);
    const parentUAL = proposal?.ual || null;

    // Publish to DKG
    const jsonldData = JSON.parse(report.jsonld_data);

    const publishResult = await publishAssetDirect(jsonldData, (progress) => {
      console.log(`Publishing report ${reportId}: ${progress.step}`);
    });

    if (!publishResult.success) {
      return res.status(500).json({
        error: 'Failed to publish to DKG',
        details: publishResult.error
      });
    }

    // Update report with DKG info
    reportQueries.updateDKGPublication(
      reportId,
      publishResult.ual,
      publishResult.assetId,
      publishResult.txHash || null,
      publishResult.explorerUrl
    );

    // Create UAL mapping if parent proposal has UAL
    if (parentUAL) {
      try {
        ualMappingQueries.createMapping(parentUAL, reportId, publishResult.ual);
      } catch (mappingError) {
        console.error('Failed to create UAL mapping:', mappingError);
      }
    }

    res.json({
      success: true,
      message: 'Premium report published to DKG successfully',
      ual: publishResult.ual,
      explorerUrl: publishResult.explorerUrl,
      parentUAL
    });
  } catch (error) {
    console.error('Error publishing premium report:', error);
    res.status(500).json({
      error: 'Failed to publish premium report',
      details: error.message
    });
  }
});

/**
 * POST /api/premium-reports/:id/request-access
 * Request access to a premium report (X402 payment flow)
 */
router.post('/:id/request-access', async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const { wallet, signature, message, tx_hash } = req.body;

    if (!wallet || !signature || !message) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['wallet', 'signature', 'message']
      });
    }

    // Process the payment and grant access
    const result = await processPremiumAccess(
      reportId,
      wallet,
      signature,
      message,
      tx_hash
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error requesting premium access:', error);
    res.status(500).json({
      error: 'Failed to process access request',
      details: error.message
    });
  }
});

/**
 * GET /api/premium-reports/:id/payment-message
 * Get payment message for signing
 */
router.get('/:id/payment-message', (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const { wallet } = req.query;

    if (!wallet) {
      return res.status(400).json({
        error: 'Wallet address required',
        message: 'Provide wallet address as query parameter'
      });
    }

    const report = reportQueries.getById(reportId);

    if (!report) {
      return res.status(404).json({
        error: 'Report not found'
      });
    }

    if (!report.is_premium) {
      return res.status(400).json({
        error: 'This is not a premium report'
      });
    }

    const message = generatePaymentMessage(reportId, wallet, report.premium_price_trac);

    res.json({
      success: true,
      message,
      reportId,
      wallet,
      amount: report.premium_price_trac,
      currency: 'TRAC'
    });
  } catch (error) {
    console.error('Error generating payment message:', error);
    res.status(500).json({
      error: 'Failed to generate payment message',
      details: error.message
    });
  }
});

/**
 * GET /api/premium-reports/my-access
 * Get all premium reports the authenticated user has access to
 */
router.get('/user/my-access', authenticateWallet, (req, res) => {
  try {
    const userWallet = req.userWallet;
    const accessRecords = premiumAccessQueries.getAccessByUser(userWallet);

    // Enrich with report data
    const enrichedRecords = accessRecords.map(access => {
      const report = reportQueries.getById(access.report_id);
      return {
        ...access,
        report: report ? {
          report_id: report.report_id,
          report_name: report.report_name,
          referendum_index: report.referendum_index,
          report_ual: report.report_ual,
          author_type: report.author_type
        } : null
      };
    });

    res.json({
      success: true,
      access_records: enrichedRecords,
      count: enrichedRecords.length
    });
  } catch (error) {
    console.error('Error fetching user access:', error);
    res.status(500).json({
      error: 'Failed to fetch access records',
      details: error.message
    });
  }
});

/**
 * GET /api/premium-reports/ual/:ual/linked-reports
 * Get all premium reports linked to a proposal UAL
 */
router.get('/ual/:ual/linked-reports', optionalAuthenticateWallet, (req, res) => {
  try {
    const proposalUAL = decodeURIComponent(req.params.ual);
    const userWallet = req.userWallet;

    const mappedReports = ualMappingQueries.getByProposalUAL(proposalUAL);

    // Filter based on access
    const filteredReports = mappedReports.map(report => {
      if (!userWallet || !checkUserAccess(report.report_id, userWallet)) {
        return {
          report_id: report.report_id,
          report_name: report.report_name,
          report_ual: report.report_ual,
          premium_price_trac: report.premium_price_trac,
          author_type: report.author_type,
          has_access: false,
          payment_required: true
        };
      } else {
        return {
          ...report,
          has_access: true,
          payment_required: false
        };
      }
    });

    res.json({
      success: true,
      proposal_ual: proposalUAL,
      reports: filteredReports,
      count: filteredReports.length
    });
  } catch (error) {
    console.error('Error fetching UAL linked reports:', error);
    res.status(500).json({
      error: 'Failed to fetch linked reports',
      details: error.message
    });
  }
});

export default router;
