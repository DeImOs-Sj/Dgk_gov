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

  const address = accounts[0].toLowerCase();

  // 2. Create wallet client WITH the account explicitly
  const walletClient = createWalletClient({
    account: address,                   // ← THIS IS REQUIRED in viem v2+
    chain: baseSepolia.id,
    transport: custom(window.ethereum),
  });

  console.log('Viem wallet client created for x402 payment', walletClient);
  console.log('Using wallet:', address);

  return walletClient;
}
/**
 * Request access to a premium report using x402 payment protocol
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
  requestPremiumAccessWithX402,
  requestPremiumAccessManual,
  checkPremiumAccess,
  getPaymentInfo
};
