/**
 * Authentication Middleware for Web3 Wallet
 */

import { ethers } from 'ethers';

/**
 * Middleware to verify wallet ownership via signed message
 * Expects headers:
 *   - x-wallet-address: The wallet address
 *   - x-wallet-signature: Signature of a standard auth message
 *   - x-wallet-message: The message that was signed (Base64 encoded)
 */
export function authenticateWallet(req, res, next) {
  try {
    const walletAddress = req.headers['x-wallet-address'];
    const signature = req.headers['x-wallet-signature'];
    const encodedMessage = req.headers['x-wallet-message'];

    if (!walletAddress || !signature || !encodedMessage) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Missing wallet authentication headers (x-wallet-address, x-wallet-signature, x-wallet-message)'
      });
    }

    // Decode the Base64-encoded message
    const message = Buffer.from(encodedMessage, 'base64').toString('utf-8');

    // Verify the signature
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Wallet signature verification failed'
      });
    }

    // Validate message timestamp (prevent replay attacks)
    const timestampMatch = message.match(/Timestamp: (\d+)/);
    if (timestampMatch) {
      const messageTimestamp = parseInt(timestampMatch[1]);
      const now = Date.now();
      const maxAge = 5 * 60 * 1000; // 5 minutes for auth messages

      if (now - messageTimestamp > maxAge) {
        return res.status(401).json({
          error: 'Authentication expired',
          message: 'Authentication message is too old. Please sign a new message.'
        });
      }
    }

    // Attach wallet address to request object
    req.userWallet = walletAddress;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Authentication failed',
      message: error.message
    });
  }
}

/**
 * Optional authentication middleware
 * Authenticates if headers are present, but doesn't require them
 */
export function optionalAuthenticateWallet(req, res, next) {
  const walletAddress = req.headers['x-wallet-address'];
  const signature = req.headers['x-wallet-signature'];
  const message = req.headers['x-wallet-message'];

  // If no auth headers, continue without authentication
  if (!walletAddress && !signature && !message) {
    req.userWallet = null;
    return next();
  }

  // If some but not all headers present, return error
  if (!walletAddress || !signature || !message) {
    return res.status(401).json({
      error: 'Incomplete authentication',
      message: 'All authentication headers must be provided (x-wallet-address, x-wallet-signature, x-wallet-message)'
    });
  }

  // Use full authentication
  authenticateWallet(req, res, next);
}

/**
 * Generate a standard authentication message for wallet signing
 * @param {string} walletAddress - The wallet address
 * @returns {string} Message to be signed
 */
export function generateAuthMessage(walletAddress) {
  const timestamp = Date.now();
  const message = `Sign this message to authenticate with the Polkadot Governance DKG Platform

Wallet: ${walletAddress}
Timestamp: ${timestamp}
Network: OriginTrail Parachain

This signature will not trigger any blockchain transaction or cost any gas fees.`;

  return message;
}

/**
 * Middleware to check if user is an admin
 * Requires authenticateWallet to be called first
 */
export function requireAdmin(req, res, next) {
  // Get admin addresses from environment variable
  const adminAddresses = (process.env.ADMIN_ADDRESSES || '')
    .split(',')
    .map(addr => addr.trim().toLowerCase())
    .filter(addr => addr);

  if (!req.userWallet) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'You must be authenticated to access this resource'
    });
  }

  const isAdmin = adminAddresses.includes(req.userWallet.toLowerCase());

  if (!isAdmin) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required'
    });
  }

  req.isAdmin = true;
  next();
}

export default {
  authenticateWallet,
  optionalAuthenticateWallet,
  generateAuthMessage,
  requireAdmin
};
