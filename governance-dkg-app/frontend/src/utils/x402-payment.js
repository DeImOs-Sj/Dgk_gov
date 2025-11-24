/**
 * X402 Payment Utility for Frontend
 * Handles automatic crypto payments for premium content using Base Sepolia testnet
 */

import { wrapFetchWithPayment } from 'x402-fetch';
import { createWalletClient, custom } from 'viem';
import { baseSepolia } from 'viem/chains';
import { ethers } from 'ethers';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Create a viem wallet client from MetaMask
 * @returns {Promise<Object>} Viem wallet client
 */
async function createViemWalletClient() {
  if (!window.ethereum) {
    throw new Error('MetaMask not installed. Please install MetaMask.');
  }

  // 1. Request accounts first
  const accounts = await window.ethereum.request({
    method: 'eth_requestAccounts',
  });

  if (!accounts || accounts.length === 0) {
    throw new Error('No accounts found. Please connect MetaMask.');
  }

  const address = accounts[0];

  // 2. Create wallet client with proper account object
  const walletClient = createWalletClient({
    account: address, // viem will convert this to proper Account object
    chain: baseSepolia,
    transport: custom(window.ethereum),
  });

  // 3. Verify the account is properly set
  const account = walletClient.account;
  if (!account) {
    throw new Error('Failed to initialize wallet account');
  }

  console.log('✅ Viem wallet client created for x402 payment');
  console.log('   Connected account:', account.address);
  console.log('   Account type:', account.type); // Should show "json-rpc"

  return walletClient;
}


/**
 * Get premium report with automatic X402 payment (NEW SIMPLIFIED FLOW)
 * This function uses GET endpoint with a single request flow:
 * 1. GET report → 402 if payment needed
 * 2. X402 library handles payment automatically
 * 3. GET retries → 200 with report data
 *
 * @param {number} reportId - The premium report ID
 * @param {string} userWallet - User's wallet address
 * @returns {Promise<Object>} Report data or error
 */
export async function getPremiumReportWithX402(reportId, userWallet) {
  try {
    console.log('🔐 Starting simplified X402 payment flow (GET)...');
    console.log(`   Report ID: ${reportId}`);
    console.log(`   Wallet: ${userWallet}`);

    // Create viem wallet client from MetaMask
    const walletClient = await createViemWalletClient();
    console.log('✅ Viem wallet client created',walletClient);

    // Wrap fetch with x402 payment capabilities
    const fetchWithPayment = wrapFetchWithPayment(fetch, walletClient);

    // Make GET request with wallet parameter
    // X402 will automatically handle 402 → payment → retry
    const response = await fetchWithPayment(
      `${API_BASE_URL}/api/premium-reports/${reportId}?wallet=${userWallet}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
console.log('✅ GET request completed with status', response);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    console.log('✅ Premium report access successful');
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('❌ X402 payment error:', error);
    return {
      success: false,
      error: error.message || 'Payment failed. Please try again.'
    };
  }
}

/**
 * Request access to a premium report using x402 payment protocol (LEGACY POST FLOW)
 * This function automatically handles:
 * 1. Detecting 402 Payment Required responses
 * 2. Creating payment proof on Base Sepolia
 * 3. Retrying request with payment header
 *
 * @param {number} reportId - The premium report ID
 * @param {string} userWallet - User's wallet address
 * @returns {Promise<Object>} Access response with report details
 */
export async function requestPremiumAccessWithX402(reportId, userWallet) {
  try {
    console.log('Starting x402 payment flow for report access...');
    // Create viem wallet client from MetaMask
    const walletClient = await createViemWalletClient();


    console.log('Viem wallet client created for x402 payment',walletClient.account);

    // Wrap fetch with x402 payment capabilities
    const fetchWithPayment = wrapFetchWithPayment(fetch, walletClient);


    // Make the request - x402 will automatically handle payment if needed
    const response = await fetchWithPayment(
      `${API_BASE_URL}/api/premium-reports/${reportId}/request-access`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wallet: userWallet })
      }
    );

    // Parse response
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('X402 payment error:', error);
    return {
      success: false,
      error: error.message || 'Payment failed. Please try again.'
    };
  }
}

/**
 * Alternative simpler approach: Manual payment with MetaMask signature
 * This is kept as a fallback if x402 automatic flow has issues
 *
 * @param {number} reportId - The premium report ID
 * @param {string} userWallet - User's wallet address
 * @returns {Promise<Object>} Access response
 */
export async function requestPremiumAccessManual(reportId, userWallet) {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    // Direct API call with wallet in body
    // The x402 middleware on the backend will return 402 with payment requirements
    const response = await fetch(
      `${API_BASE_URL}/api/premium-reports/${reportId}/request-access`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wallet: userWallet })
      }
    );

    if (response.status === 402) {
      // Payment required - show payment modal or instructions
      const paymentData = await response.json();
      throw new Error(`Payment of ${paymentData.price} required. Please use the automatic payment flow.`);
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Manual payment error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Check if user has access to a premium report
 * @param {number} reportId - The report ID
 * @param {string} userWallet - User's wallet address
 * @param {Object} authHeaders - Authentication headers
 * @returns {Promise<boolean>} True if user has access
 */
export async function checkPremiumAccess(reportId, userWallet, authHeaders = {}) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/premium-reports/${reportId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        }
      }
    );

    // If 402, user doesn't have access
    if (response.status === 402) {
      return false;
    }

    // If 200, user has access
    if (response.ok) {
      const data = await response.json();
      return data.success;
    }

    return false;
  } catch (error) {
    console.error('Error checking access:', error);
    return false;
  }
}

/**
 * Get payment information for a premium report
 * @param {number} reportId - The report ID
 * @returns {Promise<Object>} Payment details (price, currency, etc.)
 */
export async function getPaymentInfo(reportId) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/premium-reports/${reportId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.status === 402) {
      const data = await response.json();
      return {
        paymentRequired: true,
        price: data.price,
        currency: data.currency || 'USD',
        reportName: data.reportName
      };
    }

    return { paymentRequired: false };
  } catch (error) {
    console.error('Error getting payment info:', error);
    return { error: error.message };
  }
}

export default {
  getPremiumReportWithX402,        // NEW: Single GET request flow
  requestPremiumAccessWithX402,    // LEGACY: POST request flow
  requestPremiumAccessManual,
  checkPremiumAccess,
  getPaymentInfo
};
