/**
 * X402 Payment Verification Service
 * Handles signed message verification for TRAC token payments on OriginTrail Parachain
 */

import { ethers } from 'ethers';
import { premiumAccessQueries, reportQueries } from '../database/db.js';

/**
 * Generate a payment message for user to sign
 * @param {number} reportId - The premium report ID
 * @param {string} userWallet - User's wallet address
 * @param {number} amount - Amount in TRAC tokens
 * @returns {string} Message to be signed
 */
export function generatePaymentMessage(reportId, userWallet, amount) {
  const timestamp = Date.now();
  const message = `Premium Report Access Payment
Report ID: ${reportId}
Wallet: ${userWallet}
Amount: ${amount} TRAC
Timestamp: ${timestamp}
Network: OriginTrail Parachain

By signing this message, I confirm my request to access this premium report.`;

  return message;
}

/**
 * Verify signed message from user's wallet
 * @param {string} message - Original message that was signed
 * @param {string} signature - Signature from user's wallet
 * @param {string} expectedAddress - Expected signer's address
 * @returns {Object} Verification result
 */
export async function verifySignature(message, signature, expectedAddress) {
  try {
    // Recover the address from the signature
    const recoveredAddress = ethers.verifyMessage(message, signature);

    // Normalize addresses for comparison (lowercase)
    const normalizedRecovered = recoveredAddress.toLowerCase();
    const normalizedExpected = expectedAddress.toLowerCase();

    const isValid = normalizedRecovered === normalizedExpected;

    return {
      valid: isValid,
      recoveredAddress,
      expectedAddress,
      message: isValid ? 'Signature verified successfully' : 'Signature verification failed - address mismatch'
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message,
      message: 'Invalid signature format or unable to recover address'
    };
  }
}

/**
 * Process payment request for premium report access
 * @param {number} reportId - The premium report ID
 * @param {string} userWallet - User's wallet address
 * @param {string} signature - User's signature
 * @param {string} message - Original signed message
 * @param {string} txHash - Optional transaction hash if actual payment was made
 * @returns {Object} Processing result
 */
export async function processPremiumAccess(reportId, userWallet, signature, message, txHash = null) {
  try {
    // Get the report to verify it's premium and get the price
    const report = reportQueries.getById(reportId);

    if (!report) {
      return {
        success: false,
        error: 'Report not found'
      };
    }

    if (!report.is_premium) {
      return {
        success: false,
        error: 'This is not a premium report'
      };
    }

    if (!report.report_ual) {
      return {
        success: false,
        error: 'Report has not been published to DKG yet'
      };
    }

    // Check if user already has access
    const existingAccess = premiumAccessQueries.getAccessRecord(reportId, userWallet);
    if (existingAccess && existingAccess.access_granted) {
      return {
        success: false,
        error: 'You already have access to this report',
        existingAccess: true
      };
    }

    // Verify the signature
    const verification = await verifySignature(message, signature, userWallet);

    if (!verification.valid) {
      return {
        success: false,
        error: 'Signature verification failed',
        details: verification.message
      };
    }

    // Verify the message contains correct information
    const messageValidation = validatePaymentMessage(message, reportId, userWallet, report.premium_price_trac);

    if (!messageValidation.valid) {
      return {
        success: false,
        error: 'Payment message validation failed',
        details: messageValidation.error
      };
    }

    // Create access record
    let accessId;
    if (existingAccess) {
      // Update existing record
      accessId = existingAccess.access_id;
    } else {
      // Create new access record
      const result = premiumAccessQueries.requestAccess({
        report_id: reportId,
        user_wallet: userWallet,
        payment_signature: signature,
        payment_message: message,
        paid_amount_trac: report.premium_price_trac,
        payment_tx_hash: txHash
      });
      accessId = result.lastInsertRowid;
    }

    // Grant access
    premiumAccessQueries.grantAccess(accessId);

    return {
      success: true,
      accessId,
      reportId,
      reportUAL: report.report_ual,
      message: 'Access granted successfully'
    };
  } catch (error) {
    console.error('Error processing premium access:', error);
    return {
      success: false,
      error: 'Internal server error',
      details: error.message
    };
  }
}

/**
 * Validate that payment message contains correct information
 * @param {string} message - The payment message
 * @param {number} reportId - Expected report ID
 * @param {string} userWallet - Expected wallet address
 * @param {number} amount - Expected amount
 * @returns {Object} Validation result
 */
function validatePaymentMessage(message, reportId, userWallet, amount) {
  try {
    // Check if message contains the report ID
    if (!message.includes(`Report ID: ${reportId}`)) {
      return {
        valid: false,
        error: 'Message does not contain correct Report ID'
      };
    }

    // Check if message contains the wallet address
    if (!message.includes(`Wallet: ${userWallet}`)) {
      return {
        valid: false,
        error: 'Message does not contain correct wallet address'
      };
    }

    // Check if message contains the amount
    if (!message.includes(`Amount: ${amount} TRAC`)) {
      return {
        valid: false,
        error: 'Message does not contain correct payment amount'
      };
    }

    // Check if message contains timestamp (basic validation)
    const timestampMatch = message.match(/Timestamp: (\d+)/);
    if (!timestampMatch) {
      return {
        valid: false,
        error: 'Message does not contain valid timestamp'
      };
    }

    // Check if timestamp is reasonable (not too old, not in future)
    const messageTimestamp = parseInt(timestampMatch[1]);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    if (messageTimestamp > now + 60000) {
      return {
        valid: false,
        error: 'Message timestamp is in the future'
      };
    }

    if (now - messageTimestamp > maxAge) {
      return {
        valid: false,
        error: 'Message is too old (max 24 hours)'
      };
    }

    return {
      valid: true
    };
  } catch (error) {
    return {
      valid: false,
      error: `Message validation error: ${error.message}`
    };
  }
}

/**
 * Check if user has access to a premium report
 * @param {number} reportId - The report ID
 * @param {string} userWallet - User's wallet address
 * @returns {boolean} True if user has access
 */
export function checkUserAccess(reportId, userWallet) {
  return premiumAccessQueries.hasAccess(reportId, userWallet);
}

/**
 * Get premium report content (only if user has access)
 * @param {number} reportId - The report ID
 * @param {string} userWallet - User's wallet address
 * @returns {Object} Report data or access denied
 */
export function getPremiumReportContent(reportId, userWallet) {
  const report = reportQueries.getById(reportId);

  if (!report) {
    return {
      success: false,
      error: 'Report not found',
      statusCode: 404
    };
  }

  if (!report.is_premium) {
    // Not a premium report, return full content
    return {
      success: true,
      report,
      statusCode: 200
    };
  }

  // Check if user has access
  const hasAccess = checkUserAccess(reportId, userWallet);

  if (!hasAccess) {
    // Return HTTP 402 Payment Required with pricing info
    return {
      success: false,
      error: 'Payment required to access this premium report',
      statusCode: 402,
      paymentRequired: true,
      reportId: report.report_id,
      reportName: report.report_name,
      price: report.premium_price_trac,
      currency: 'TRAC',
      reportUAL: report.report_ual,
      // Return only metadata, not actual content
      metadata: {
        report_id: report.report_id,
        report_name: report.report_name,
        referendum_index: report.referendum_index,
        author_type: report.author_type,
        premium_price_trac: report.premium_price_trac,
        data_size_bytes: report.data_size_bytes,
        verification_status: report.verification_status,
        submitted_at: report.submitted_at
      }
    };
  }

  // User has access, return full content
  return {
    success: true,
    report,
    statusCode: 200
  };
}

export default {
  generatePaymentMessage,
  verifySignature,
  processPremiumAccess,
  checkUserAccess,
  getPremiumReportContent
};
