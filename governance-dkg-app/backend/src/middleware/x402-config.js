/**
 * X402 Payment Middleware Configuration for Base Sepolia
 * Enables crypto payments for premium report access
 */

import { reportQueries } from '../database/db.js';
import { paymentMiddleware } from 'x402-express';

// Base Sepolia testnet facilitator URL
const FACILITATOR_URL = "https://x402.org/facilitator";

/**
 * Get the price for a premium report in USD
 * @param {number} reportId - The premium report ID
 * @returns {string|null} Price in USD format (e.g., "$0.001")
 */
function getReportPrice(reportId) {
  const report = reportQueries.getById(reportId);
  if (!report || !report.is_premium) {
    return null;
  }

  // Convert TRAC price to USD equivalent
  // For testnet, we'll use a simple conversion: 1 TRAC ≈ $0.01 USD
  const tracPrice = report.premium_price_trac || 0;
  const usdPrice = tracPrice * 0.01;

  return `$${usdPrice.toFixed(3)}`;
}

/**
 * Create x402 middleware for a specific report's payee wallet
 * Since each report has a different payee, we need to create middleware instances per route
 * @param {number} reportId - The premium report ID
 * @returns {Function|null} Express middleware function
 */
export function createReportX402Middleware(reportId) {
  const report = reportQueries.getById(reportId);

  if (!report || !report.is_premium || !report.payee_wallet) {
    return null;
  }

  const routeConfig = {
    [`POST /api/premium-reports/${reportId}/request-access`]: {
      price: getReportPrice(reportId),
      network: "base-sepolia",
      description: `Access to premium report: ${report.report_name || `Report #${reportId}`}`,
      inputSchema: {
        type: "object",
        properties: {
          wallet: {
            type: "string",
            description: "User's wallet address"
          }
        },
        required: ["wallet"]
      },
      outputSchema: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          accessId: { type: "number" },
          reportId: { type: "number" },
          reportUAL: { type: "string" },
          message: { type: "string" }
        }
      }
    }
  };

  const facilitator = { url: FACILITATOR_URL };

  return paymentMiddleware(report.payee_wallet, routeConfig, facilitator);
}

/**
 * Create a dynamic x402 middleware that handles all premium reports
 * This middleware will check the report ID from the request and apply the appropriate payee wallet
 */
export function createDynamicX402Middleware() {
  return (req, res, next) => {
    // Extract report ID from the URL path
    const match = req.path.match(/\/api\/premium-reports\/(\d+)\/request-access/);

    if (!match) {
      // Not a request-access route, skip x402
      return next();
    }

    const reportId = parseInt(match[1]);
    const report = reportQueries.getById(reportId);

    // If not a premium report, skip x402
    if (!report || !report.is_premium || !report.payee_wallet) {
      return next();
    }

    // Create x402 middleware for this specific report
    const middleware = createReportX402Middleware(reportId);

    if (!middleware) {
      return next();
    }

    // Apply the x402 middleware
    middleware(req, res, next);
  };
}

export { FACILITATOR_URL };
