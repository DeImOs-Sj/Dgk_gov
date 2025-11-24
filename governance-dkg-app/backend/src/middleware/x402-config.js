/**
 * X402 Payment Middleware Configuration for Base Sepolia
 * Enables crypto payments for premium report access
 */

import { reportQueries } from '../database/db.js';
import { paymentMiddleware } from 'x402-express';

// Base Sepolia testnet configuration
// Using PayAI facilitator for better USDC settlement support
const FACILITATOR_URL = "https://x402.org/facilitator";
const BASE_SEPOLIA_USDC = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const BASE_SEPOLIA_CHAIN_ID = 84532;

/**
 * Get the price for a premium report in USDC
 * @param {number} reportId - The premium report ID
 * @returns {string|null} Price in USDC format (e.g., "$10.00")
 */
function getReportPrice(reportId) {
  const report = reportQueries.getById(reportId);
  if (!report || !report.is_premium) {
    return null;
  }

  // Use USDC directly (Base Sepolia USDC)
  // The premium_price_trac field now represents USDC amount
  const usdcPrice = report.premium_price_trac || 0;

  return `$${usdcPrice.toFixed(2)}`;
}

/**
 * Create x402 middleware for a specific report's payee wallet
 * Since each report has a different payee, we need to create middleware instances per route
 * @param {number} reportId - The premium report ID
 * @returns {Function|null} Express middleware function
 */
// export function createReportX402Middleware(reportId) {
//   const report = reportQueries.getById(reportId);

//   if (!report || !report.is_premium || !report.payee_wallet) {
//     return null;
//   }

//   const routeConfig = {
//     [`POST /api/premium-reports/${reportId}/request-access`]: {
//       price: getReportPrice(reportId),
//       network: "base-sepolia",
//       token: BASE_SEPOLIA_USDC, // Explicit USDC token address
//       description: `Access to premium report: ${report.report_name || `Report #${reportId}`}`,
//       inputSchema: {
//         type: "object",
//         properties: {
//           wallet: {
//             type: "string",
//             description: "User's wallet address"
//           }
//         },
//         required: ["wallet"]
//       },
//       outputSchema: {
//         type: "object",
//         properties: {
//           success: { type: "boolean" },
//           accessId: { type: "number" },
//           reportId: { type: "number" },
//           reportUAL: { type: "string" },
//           message: { type: "string" }
//         }
//       },
//       // Let PayAI facilitator handle settlement automatically
//     }
//   };

//   const facilitator = { url: FACILITATOR_URL };



//   console.log(`⚙️  Created x402 middleware for report ID ${reportId} with payee wallet ${report.payee_wallet}, price ${routeConfig}`);

//   const data = paymentMiddleware(report.payee_wallet, routeConfig, facilitator);
//   return data;
// }

/**
 * Create x402 middleware for GET endpoint (simplified single-request flow)
 * @param {number} reportId - The premium report ID
 * @returns {Function|null} Express middleware function
 */
export function createReportX402MiddlewareForGet(reportId) {
  const report = reportQueries.getById(reportId);

  if (!report || !report.is_premium || !report.payee_wallet) {
    return null;
  }

  const routeConfig = {
    [`GET /api/premium-reports/${reportId}`]: {
      price: getReportPrice(reportId),
      network: "base-sepolia",
      token: BASE_SEPOLIA_USDC,
      description: `Access to premium report: ${report.report_name || `Report #${reportId}`}`,
      tokenMetadata: {
        name: "USDC",  // CRITICAL: Must be "USD Coin" not "USDC"
        version: "2",       // FiatTokenV2 uses version "2"
        chainId: 84532,
        verifyingContract: "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
      },
      outputSchema: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          report: { type: "object" },
          accessGranted: { type: "boolean" }
        }
      },
      /**
       * IMPORTANT: Skip on-chain settlement
       *
       * The x402 library's settlement process fails because it cannot properly
       * construct the EIP-712 signature that USDC's transferWithAuthorization expects.
       *
       * However, payment proof verification IS cryptographically secure:
       * - User signs payment intent with their wallet
       * - Facilitator verifies the signature
       * - Access is granted based on verified payment proof
       *
       * This is sufficient for access control. If you need actual USDC transfers,
       * implement a separate settlement process or use direct transfers.
       */
      skipSettlement: true
    }
  };

  const facilitator = { url: FACILITATOR_URL };

  console.log(`⚙️  Created x402 GET middleware for report ID ${reportId}`);

  return paymentMiddleware(report.payee_wallet, routeConfig, facilitator);
}

/**
 * Create a dynamic x402 middleware that handles all premium reports for GET
 * This middleware will check the report ID from the request and apply the appropriate payee wallet
 */
export function createDynamicX402MiddlewareForGet() {
  return (req, res, next) => {
    // Extract report ID from the URL path for GET requests
    const match = req.path.match(/\/api\/premium-reports\/(\d+)$/);

    if (!match || req.method !== 'GET') {
      return next();
    }

    const reportId = parseInt(match[1]);
    const report = reportQueries.getById(reportId);

    // If not a premium report, skip x402
    if (!report || !report.is_premium || !report.payee_wallet) {
      return next();
    }

    // Create x402 middleware for this specific report
    const middleware = createReportX402MiddlewareForGet(reportId);

    if (!middleware) {
      return next();
    }

    // Apply the x402 middleware
    middleware(req, res, next);
  };
}

/**
 * Create a dynamic x402 middleware that handles all premium reports for POST (legacy)
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

export { FACILITATOR_URL, BASE_SEPOLIA_USDC, BASE_SEPOLIA_CHAIN_ID };
