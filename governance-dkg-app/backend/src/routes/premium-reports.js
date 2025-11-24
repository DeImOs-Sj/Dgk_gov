/**
 * Premium Reports API Routes with X402 Payment Integration
 */

import express from "express";
import {
  reportQueries,
  premiumAccessQueries,
  ualMappingQueries,
  proposalQueries,
} from "../database/db.js";
import {
  getPremiumReportContent,
  checkUserAccess,
} from "../services/x402-payment-service.js";
import {
  authenticateWallet,
  optionalAuthenticateWallet,
  requireAdmin,
  generateAuthMessage,
} from "../middleware/auth.js";
import { verifyReport } from "../services/ai-verification-service.js";
import { publishAsset, getDKGExplorerURL } from "../services/dkg-service.js";
import { publishAssetDirect } from "../services/dkg-direct-service.js";

const router = express.Router();

/**
 * GET /api/premium-reports/auth-message/:wallet
 * Generate authentication message for wallet signing
 */
router.get("/auth-message/:wallet", (req, res) => {
  try {
    const { wallet } = req.params;
    const message = generateAuthMessage(wallet);

    res.json({
      success: true,
      message,
      wallet,
    });
  } catch (error) {
    console.error("Error generating auth message:", error);
    res.status(500).json({
      error: "Failed to generate authentication message",
      details: error.message,
    });
  }
});

/**
 * GET /api/premium-reports/proposal/:index
 * Get all premium reports for a proposal
 */
router.get("/proposal/:index", optionalAuthenticateWallet, (req, res) => {
  try {
    const referendumIndex = parseInt(req.params.index);
    const userWallet = req.userWallet;

    const reports = reportQueries.getPremiumByProposal(referendumIndex);

    // Filter out content for reports user doesn't have access to
    const filteredReports = reports.map((report) => {
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
          payment_required: true,
        };
      } else {
        // User has access, return full report
        return {
          ...report,
          has_access: true,
          payment_required: false,
        };
      }
    });

    res.json({
      success: true,
      reports: filteredReports,
      count: filteredReports.length,
    });
  } catch (error) {
    console.error("Error fetching premium reports:", error);
    res.status(500).json({
      error: "Failed to fetch premium reports",
      details: error.message,
    });
  }
});

/**
 * GET /api/premium-reports/:id
 * Get a specific premium report with X402 payment integration
 * This endpoint automatically handles payment via x402 middleware for premium reports
 */
router.get("/:id", (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const report = reportQueries.getById(reportId);

    if (!report) {
      return res.status(404).json({
        error: "Report not found",
      });
    }

    // For non-premium reports, return immediately
    if (!report.is_premium) {
      return res.json({
        success: true,
        report,
      });
    }

    // For premium reports with x402 payment
    // Extract wallet from query param or body (x402 flow)
    const userWallet = req.query.wallet || req.body?.wallet;

    if (!userWallet) {
      return res.status(400).json({
        error: "Wallet address required for premium reports",
        hint: "Add ?wallet=YOUR_ADDRESS to the URL",
      });
    }

    // Check if user already has access
    const hasAccess = checkUserAccess(reportId, userWallet);

    if (hasAccess) {
      // User already paid, return full content
      console.log(`✅ User ${userWallet} has access to report ${reportId}`);
      return res.json({
        success: true,
        report,
        accessGranted: true,
      });
    }

    // If we reach here after x402 middleware, payment was verified
    // The x402 middleware only lets the request through if payment is valid
    if (req.headers['x-payment']) {
      console.log(`✅ X402 payment verified for report ${reportId} by ${userWallet}`);

      // Grant access
      const existingAccess = premiumAccessQueries.getAccessRecord(reportId, userWallet);
      let accessId;

      if (existingAccess) {
        accessId = existingAccess.access_id;
      } else {
        const result = premiumAccessQueries.requestAccess({
          report_id: reportId,
          user_wallet: userWallet,
          payment_signature: req.headers['x-payment'],
          payment_message: 'x402 payment protocol',
          paid_amount_trac: report.premium_price_trac,
          payment_tx_hash: null,
        });
        accessId = result.lastInsertRowid;
      }

      premiumAccessQueries.grantAccess(accessId);
      console.log(`✅ Access granted to report ${reportId} for ${userWallet}`);

      return res.json({
        success: true,
        report,
        accessGranted: true,
        accessId,
      });
    }

    // No payment header means x402 middleware will handle 402 response
    // This shouldn't happen if middleware is configured correctly
    return res.status(402).json({
      error: "Payment required",
      reportId: report.report_id,
      reportName: report.report_name,
      price: report.premium_price_trac,
    });

  } catch (error) {
    console.error("Error fetching premium report:", error);
    res.status(500).json({
      error: "Failed to fetch premium report",
      details: error.message,
    });
  }
});

/**
 * POST /api/premium-reports/submit
 * Submit a new premium report (requires authentication)
 * NOTE: This only stores the report in the database, does NOT auto-verify or publish
 */
router.post("/submit", authenticateWallet, async (req, res) => {
  try {
    const {
      referendum_index,
      report_name,
      jsonld_data,
      is_premium,
      premium_price_trac,
      payee_wallet,
    } = req.body;

    const userWallet = req.userWallet;

    // Validate required fields
    if (!referendum_index || !jsonld_data) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["referendum_index", "jsonld_data"],
      });
    }

    // Check if proposal exists
    const proposal = proposalQueries.getByIndex(referendum_index);
    if (!proposal) {
      return res.status(404).json({
        error: "Proposal not found",
      });
    }

    // Check if proposal has UAL (required for report submission)
    if (!proposal.ual) {
      return res.status(400).json({
        success: false,
        error:
          "Proposal must be published to DKG before reports can be submitted",
      });
    }

    // Validate premium fields
    if (is_premium && !premium_price_trac) {
      return res.status(400).json({
        error: "Premium reports must have a price (premium_price_trac)",
      });
    }

    // Validate payee wallet for premium reports
    if (is_premium && !payee_wallet) {
      return res.status(400).json({
        error:
          "Premium reports must have a payee_wallet (address to receive payments)",
      });
    }

    // Parse JSON-LD
    let parsedData;
    try {
      parsedData =
        typeof jsonld_data === "string" ? JSON.parse(jsonld_data) : jsonld_data;

      // Check for required JSON-LD fields
      if (!parsedData["@context"] || !parsedData["@type"]) {
        return res.status(400).json({
          error: "Invalid JSON-LD: missing @context or @type",
        });
      }
    } catch (error) {
      return res.status(400).json({
        error: "Invalid JSON-LD format",
        details: error.message,
      });
    }

    // Calculate data size
    const jsonldString = JSON.stringify(parsedData);
    const dataSize = Buffer.byteLength(jsonldString, "utf8");

    // Check if user is admin (for author_type)
    const adminAddresses = (process.env.ADMIN_ADDRESSES || "")
      .split(",")
      .map((addr) => addr.trim().toLowerCase())
      .filter((addr) => addr);
    const isAdmin = adminAddresses.includes(userWallet.toLowerCase());
    const authorType = isAdmin ? "admin" : "community";

    // Insert report (just store in database, no verification yet)
    const result = reportQueries.insert({
      referendum_index,
      submitter_wallet: userWallet,
      report_name: report_name || `Premium Report ${Date.now()}`,
      jsonld_data: jsonldString,
      data_size_bytes: dataSize,
      required_payment_trac: 0, // No submission fee for premium reports
      payment_address: null,
      is_premium: is_premium ? 1 : 0,
      premium_price_trac: is_premium ? premium_price_trac : null,
      payee_wallet: is_premium ? payee_wallet : null,
      author_type: authorType,
    });

    const reportId = result.lastInsertRowid;

    console.log(`📝 Premium report ${reportId} submitted by ${userWallet}`);
    console.log(
      `   Payee: ${payee_wallet || "N/A"}, Price: ${
        premium_price_trac || 0
      } TRAC`
    );

    res.status(201).json({
      success: true,
      message: "Premium report submitted successfully",
      report: {
        report_id: reportId,
        referendum_index,
        submitter_wallet: userWallet,
        report_name: report_name || `Premium Report ${Date.now()}`,
        data_size_kb: (dataSize / 1024).toFixed(2),
        is_premium,
        premium_price_trac: is_premium ? premium_price_trac : null,
        payee_wallet: is_premium ? payee_wallet : null,
        author_type: authorType,
        verification_status: "pending",
      },
      next_steps: [
        "AI verification will be triggered",
        "If approved, report will be published to proposal's existing DKG UAL",
      ],
    });
  } catch (error) {
    console.error("Error submitting premium report:", error);
    res.status(500).json({
      error: "Failed to submit premium report",
      details: error.message,
    });
  }
});

/**
 * POST /api/premium-reports/:id/verify
 * Trigger AI verification for a premium report
 */
router.post("/:id/verify", async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const report = reportQueries.getById(reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: "Report not found",
      });
    }

    // Get proposal data
    const proposal = proposalQueries.getByIndex(report.referendum_index);
    if (!proposal) {
      return res.status(404).json({
        success: false,
        error: "Proposal not found",
      });
    }

    const proposalData = JSON.parse(proposal.proposal_data);
    const reportData = JSON.parse(report.jsonld_data);

    console.log(`🤖 Verifying premium report #${reportId}...`);

    // Run AI verification
    const verification = await verifyReport(
      proposalData,
      reportData,
      report.referendum_index
    );

    console.log("✅ Verification result:", verification);

    // Update report with verification results
    const status =
      verification.valid &&
      verification.confidence >= parseFloat(process.env.AI_VERIFICATION_THRESHOLD || "0.7")
        ? "verified"
        : "rejected";

    reportQueries.updateVerification(
      reportId,
      status,
      verification.confidence,
      verification.reasoning,
      verification.issues || []
    );

    res.json({
      success: true,
      verification: {
        status,
        valid: verification.valid,
        confidence: verification.confidence,
        reasoning: verification.reasoning,
        issues: verification.issues,
      },
    });
  } catch (error) {
    console.error("Error verifying premium report:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/premium-reports/:id/verify-and-publish
 * Manually trigger verification and publish for a premium report
 */
router.post("/:id/verify-and-publish", authenticateWallet, async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const userWallet = req.userWallet;

    const report = reportQueries.getById(reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: "Report not found",
      });
    }

    // Only allow the submitter or admin to trigger verification
    const adminAddresses = (process.env.ADMIN_ADDRESSES || "")
      .split(",")
      .map((addr) => addr.trim().toLowerCase())
      .filter((addr) => addr);
    const isAdmin = adminAddresses.includes(userWallet.toLowerCase());

    if (
      report.submitter_wallet.toLowerCase() !== userWallet.toLowerCase() &&
      !isAdmin
    ) {
      return res.status(403).json({
        success: false,
        error: "Only the report submitter or admin can trigger verification",
      });
    }

    // Get proposal
    const proposal = proposalQueries.getByIndex(report.referendum_index);
    if (!proposal) {
      return res.status(404).json({
        success: false,
        error: "Proposal not found",
      });
    }

    console.log(
      `🔄 Manually triggering verification for report ${reportId}...`
    );

    // Get proposal data
    const proposalData = JSON.parse(proposal.proposal_data);
    const reportData = JSON.parse(report.jsonld_data);

    // Run AI verification
    const verificationResult = await verifyReport(
      proposalData,
      reportData,
      report.referendum_index
    );

    console.log(`   Verification result:`, verificationResult);

    if (verificationResult.valid) {
      // Update verification status
      reportQueries.updateVerification(
        reportId,
        "verified",
        verificationResult.confidence,
        verificationResult.reasoning,
        verificationResult.issues || []
      );

      console.log(`✅ Report ${reportId} verified, publishing to DKG...`);

      // Ensure JSON-LD has proper structure for DKG
      // Put user fields FIRST, then override with required fields
      const dkgReadyJsonLD = {
        // Include all user-provided fields first
        ...reportData,
        // Override with required fields to ensure DKG compatibility
        "@context": {
          schema: "https://schema.org/",
          polkadot: "https://polkadot.network/governance/",
          dkg: "https://dkg.origintrail.io/",
          ...(reportData["@context"] || {}),
        },
        "@type": "schema:Report",
        "@id":
          reportData["@id"] ||
          `polkadot:referendum:${report.referendum_index}:premium-report:${reportId}`,
        "schema:name":
          reportData["schema:name"] ||
          reportData.name ||
          `Premium Report ${reportId}`,
        "schema:about": `polkadot:referendum:${report.referendum_index}`,
        "schema:dateCreated":
          reportData["schema:dateCreated"] || new Date().toISOString(),
        // Add premium metadata
        "dkg:reportType": "premium",
        "dkg:reportId": reportId,
        "dkg:premiumPrice": report.premium_price_trac,
        "dkg:payeeWallet": report.payee_wallet,
      };

      // Publish to DKG
      const dkgResult = await publishAssetDirect(
        dkgReadyJsonLD,
        {
          sourceId: `premium-report-${reportId}`,
          referendumIndex: report.referendum_index,
          reportId: reportId,
          payeeWallet: report.payee_wallet,
        },
        (progress) => {
          console.log(`     [DKG ${progress.step}] ${progress.message}`);
        }
      );

      if (dkgResult.success && dkgResult.ual) {
        // Update report with DKG information
        reportQueries.updateDKGInfo(reportId, {
          report_ual: dkgResult.ual,
          dkg_asset_id: dkgResult.assetId || "pending",
          dkg_tx_hash: dkgResult.txHash,
          dkg_block_explorer_url: dkgResult.explorerUrl,
          dkg_published_at: new Date().toISOString(),
        });

        // Create UAL mapping if proposal has UAL
        if (proposal.ual) {
          ualMappingQueries.createMapping(
            proposal.ual,
            reportId,
            dkgResult.ual
          );
        }

        console.log(`✅ Report ${reportId} published to DKG: ${dkgResult.ual}`);

        return res.json({
          success: true,
          message: "Report verified and published to DKG successfully",
          verification: {
            status: "verified",
            confidence: verificationResult.confidence,
            reasoning: verificationResult.reasoning,
          },
          dkg: {
            ual: dkgResult.ual,
            assetId: dkgResult.assetId,
            explorerUrl: dkgResult.explorerUrl,
          },
        });
      } else {
        return res.status(500).json({
          success: false,
          error:
            "Failed to publish to DKG: " + (dkgResult.error || "Unknown error"),
          verification: {
            status: "verified",
            confidence: verificationResult.confidence,
          },
        });
      }
    } else {
      // Report rejected
      reportQueries.updateVerification(
        reportId,
        "rejected",
        verificationResult.confidence || 0,
        verificationResult.reasoning || "Report did not meet quality standards",
        verificationResult.issues || []
      );

      return res.status(400).json({
        success: false,
        error: "Report verification failed",
        verification: {
          status: "rejected",
          confidence: verificationResult.confidence,
          reasoning: verificationResult.reasoning,
          issues: verificationResult.issues,
        },
      });
    }
  } catch (error) {
    console.error("Error in verify-and-publish:", error);
    return res.status(500).json({
      success: false,
      error: "Verification and publication failed",
      details: error.message,
    });
  }
});

/**
 * POST /api/premium-reports/:id/publish
 * Publish verified premium report to the existing proposal's DKG UAL
 */
router.post("/:id/publish", async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const report = reportQueries.getById(reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: "Report not found",
      });
    }

    // Check if already published
    if (report.report_ual) {
      return res.status(400).json({
        success: false,
        error: "Report already published to DKG",
        ual: report.report_ual,
      });
    }

    // Check if verified
    if (report.verification_status !== "verified") {
      return res.status(400).json({
        success: false,
        error: "Report must be verified before publishing",
        current_status: report.verification_status,
      });
    }

    // Get proposal to get parent UAL
    const proposal = proposalQueries.getByIndex(report.referendum_index);

    if (!proposal || !proposal.ual) {
      return res.status(400).json({
        success: false,
        error: "Proposal must have a DKG UAL before reports can be published",
      });
    }

    // Parse the user's JSON-LD data
    const reportJsonLD = JSON.parse(report.jsonld_data);

    // Normalize JSON-LD to ensure DKG safe mode compatibility
    // Put required fields FIRST, then merge with user data
    const dkgReadyJsonLD = {
      "@context": {
        "schema": "https://schema.org/",
        "polkadot": "https://polkadot.network/governance/",
        "dkg": "https://dkg.origintrail.io/",
        ...(typeof reportJsonLD["@context"] === "object" ? reportJsonLD["@context"] : {})
      },
      "@type": reportJsonLD["@type"] || "schema:Report",
      "@id": reportJsonLD["@id"] || `polkadot:referendum:${report.referendum_index}:premium-report:${reportId}`,
      "schema:name": reportJsonLD["schema:name"] || reportJsonLD.name || report.report_name || `Premium Report ${reportId}`,
      "schema:about": reportJsonLD["schema:about"] || `polkadot:referendum:${report.referendum_index}`,
      "schema:dateCreated": reportJsonLD["schema:dateCreated"] || report.submitted_at || new Date().toISOString(),
      "schema:isPartOf": proposal.ual,
      "schema:author": {
        "@type": "schema:Person",
        "schema:identifier": report.submitter_wallet
      },
      "polkadot:verificationStatus": report.verification_status,
      "polkadot:aiConfidence": report.ai_confidence,
      // Add premium metadata
      "dkg:reportType": "premium",
      "dkg:reportId": reportId,
      "dkg:premiumPrice": report.premium_price_trac,
      "dkg:payeeWallet": report.payee_wallet,
      // Include all other user-provided fields
      ...reportJsonLD
    };

    console.log(`📤 Publishing premium report #${reportId} with parent UAL linkage: ${proposal.ual}`);

    // Publish to DKG (creates a new asset for the report, linked to proposal)
    const result = await publishAsset(dkgReadyJsonLD, {
      sourceId: `premium-report-${reportId}`,
      reportId: reportId,
      referendumIndex: report.referendum_index,
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: "Failed to publish to DKG: " + result.error,
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

    // Create UAL mapping
    try {
      ualMappingQueries.createMapping(
        proposal.ual,
        reportId,
        result.ual
      );
    } catch (mappingError) {
      console.error("Failed to create UAL mapping:", mappingError);
    }

    console.log(`✅ Premium report published to existing UAL: ${result.ual}`);

    res.json({
      success: true,
      message: "Premium report published to proposal's existing DKG UAL",
      dkg: {
        id: result.id,
        status: result.status,
        ual: result.ual,
        explorer_url: explorerUrl,
      },
      parent_ual: proposal.ual,
    });
  } catch (error) {
    console.error("Error publishing premium report:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/premium-reports/:id/request-access
 * Request access to a premium report (X402 payment flow)
 *
 * This endpoint is protected by x402 middleware which automatically:
 * 1. Returns 402 Payment Required if payment hasn't been made
 * 2. Verifies payment on-chain through the facilitator
 * 3. Only allows this handler to execute if payment is valid
 */
router.post("/:id/request-access", async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const { wallet } = req.body;

    if (!wallet) {
      return res.status(400).json({
        error: "Missing required field: wallet",
        required: ["wallet"],
      });
    }

    const report = reportQueries.getById(reportId);

    if (!report) {
      return res.status(404).json({
        error: "Report not found",
      });
    }

    if (!report.is_premium) {
      return res.status(400).json({
        error: "This is not a premium report",
      });
    }

    if (!report.report_ual) {
      return res.status(400).json({
        error: "Report has not been published to DKG yet",
      });
    }

    // Check if user already has access
    const existingAccess = premiumAccessQueries.getAccessRecord(reportId, wallet);
    if (existingAccess && existingAccess.access_granted) {
      return res.json({
        success: true,
        message: "You already have access to this report",
        accessId: existingAccess.access_id,
        reportId,
        reportUAL: report.report_ual,
        alreadyHadAccess: true,
      });
    }

    // Payment has been verified by x402 middleware at this point
    // Extract payment proof from x402 headers if available
    const paymentProof = req.headers['x-payment'] || 'x402-verified';

    console.log(`✅ X402 Payment verified for report ${reportId} by ${wallet}`);

    // Create or update access record
    // let accessId;
    // if (existingAccess) {
    //   accessId = existingAccess.access_id;
    // } else {
    //   const result = premiumAccessQueries.requestAccess({
    //     report_id: reportId,
    //     user_wallet: wallet,
    //     payment_signature: paymentProof,
    //     payment_message: 'x402 payment protocol',
    //     paid_amount_trac: report.premium_price_trac,
    //     payment_tx_hash: null, // x402 handles this
    //   });
    //   accessId = result.lastInsertRowid;
    // }

    // // Grant access
    // premiumAccessQueries.grantAccess(accessId);

    // console.log(`✅ X402 Payment verified - Access granted to report ${reportId} for ${wallet}`);

    res.json({
      success: true,
      accessId,
      reportId,
      reportUAL: report.report_ual,
      message: "Access granted successfully via x402 payment",
    });
  } catch (error) {
    console.error("Error granting premium access:", error);
    res.status(500).json({
      error: "Failed to process access request",
      details: error.message,
    });
  }
});

/**
 * GET /api/premium-reports/my-access
 * Get all premium reports the authenticated user has access to
 */
router.get("/user/my-access", authenticateWallet, (req, res) => {
  try {
    const userWallet = req.userWallet;
    const accessRecords = premiumAccessQueries.getAccessByUser(userWallet);

    // Enrich with report data
    const enrichedRecords = accessRecords.map((access) => {
      const report = reportQueries.getById(access.report_id);
      return {
        ...access,
        report: report
          ? {
              report_id: report.report_id,
              report_name: report.report_name,
              referendum_index: report.referendum_index,
              report_ual: report.report_ual,
              author_type: report.author_type,
            }
          : null,
      };
    });

    res.json({
      success: true,
      access_records: enrichedRecords,
      count: enrichedRecords.length,
    });
  } catch (error) {
    console.error("Error fetching user access:", error);
    res.status(500).json({
      error: "Failed to fetch access records",
      details: error.message,
    });
  }
});

/**
 * GET /api/premium-reports/ual/:ual/linked-reports
 * Get all premium reports linked to a proposal UAL
 */
router.get(
  "/ual/:ual/linked-reports",
  optionalAuthenticateWallet,
  (req, res) => {
    try {
      const proposalUAL = decodeURIComponent(req.params.ual);
      const userWallet = req.userWallet;

      const mappedReports = ualMappingQueries.getByProposalUAL(proposalUAL);

      // Filter based on access
      const filteredReports = mappedReports.map((report) => {
        if (!userWallet || !checkUserAccess(report.report_id, userWallet)) {
          return {
            report_id: report.report_id,
            report_name: report.report_name,
            report_ual: report.report_ual,
            premium_price_trac: report.premium_price_trac,
            author_type: report.author_type,
            has_access: false,
            payment_required: true,
          };
        } else {
          return {
            ...report,
            has_access: true,
            payment_required: false,
          };
        }
      });

      res.json({
        success: true,
        proposal_ual: proposalUAL,
        reports: filteredReports,
        count: filteredReports.length,
      });
    } catch (error) {
      console.error("Error fetching UAL linked reports:", error);
      res.status(500).json({
        error: "Failed to fetch linked reports",
        details: error.message,
      });
    }
  }
);

export default router;
