/**
 * Hash Generation Service
 * Provides functions for generating secure hashes for private data
 */
import crypto from 'crypto';

/**
 * Generate SHA-256 hash from data
 * @param {string} data - The data to hash
 * @returns {string} - Hex-encoded hash
 */
export function generateHash(data) {
  return crypto
    .createHash('sha256')
    .update(data)
    .digest('hex');
}

/**
 * Generate unique hash for private data
 * Includes timestamp and random salt to ensure uniqueness
 * @param {string} privateData - The private JSON-LD data
 * @param {number} reportId - The report ID for additional uniqueness
 * @returns {string} - Unique hex-encoded hash
 */
export function generatePrivateDataHash(privateData, reportId) {
  const timestamp = Date.now();
  const salt = crypto.randomBytes(16).toString('hex');
  const combinedData = `${privateData}|${reportId}|${timestamp}|${salt}`;

  return generateHash(combinedData);
}

/**
 * Verify hash matches data
 * Note: This is for simple verification, not for the salted private data hash
 * @param {string} data - The data to verify
 * @param {string} hash - The hash to verify against
 * @returns {boolean} - Whether the hash matches
 */
export function verifyHash(data, hash) {
  const computedHash = generateHash(data);
  return computedHash === hash;
}

export default {
  generateHash,
  generatePrivateDataHash,
  verifyHash
};
