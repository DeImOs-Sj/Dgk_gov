/**
 * Database Schema for Polkadot Governance DKG Integration
 */

export const createTablesSQL = `
-- Proposals Table
CREATE TABLE IF NOT EXISTS proposals (
  referendum_index INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  status TEXT,
  origin TEXT,
  proposer_address TEXT,
  beneficiary_address TEXT,
  ayes_amount TEXT,
  nays_amount TEXT,
  requested_amount TEXT,
  treasury_proposal_id INTEGER,
  created_block INTEGER,
  latest_block INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,

  -- DKG Related Fields
  ual TEXT UNIQUE,
  dkg_asset_id TEXT,
  dkg_tx_hash TEXT,
  dkg_status TEXT DEFAULT 'not_published', -- 'not_published', 'pending', 'published', 'failed'
  block_explorer_url TEXT,
  published_at TIMESTAMP,

  -- Full proposal data as JSON
  proposal_data TEXT -- JSON stringified
);

-- Reports Table
CREATE TABLE IF NOT EXISTS reports (
  report_id INTEGER PRIMARY KEY AUTOINCREMENT,
  referendum_index INTEGER NOT NULL,
  submitter_wallet TEXT NOT NULL,
  report_name TEXT,

  -- Report Content
  jsonld_data TEXT NOT NULL, -- JSON-LD as string
  data_size_bytes INTEGER,

  -- Premium Report Fields (X402)
  is_premium BOOLEAN DEFAULT 0, -- Premium reports require payment to access
  premium_price_trac REAL, -- Price to access this premium report
  payee_wallet TEXT, -- Wallet address that receives payments for this premium report
  author_type TEXT DEFAULT 'community', -- 'community' or 'admin'

  -- Payment Info (for report submission)
  required_payment_trac REAL,
  payment_address TEXT,
  payment_confirmed BOOLEAN DEFAULT 0,

  -- Verification
  verification_status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
  ai_confidence REAL,
  ai_reasoning TEXT,
  verification_issues TEXT, -- JSON array of issues
  verified_at TIMESTAMP,

  -- DKG Publication
  report_ual TEXT UNIQUE,
  dkg_asset_id TEXT,
  dkg_tx_hash TEXT,
  dkg_block_explorer_url TEXT,
  dkg_published_at TIMESTAMP,

  -- Timestamps
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (referendum_index) REFERENCES proposals(referendum_index)
);

-- Premium Report Access Table (X402 Payment Tracking)
CREATE TABLE IF NOT EXISTS premium_report_access (
  access_id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id INTEGER NOT NULL,
  user_wallet TEXT NOT NULL,

  -- Payment Verification (Signed Message)
  payment_signature TEXT NOT NULL, -- User's signature proving payment capability
  payment_message TEXT NOT NULL, -- Original message that was signed
  signature_verified BOOLEAN DEFAULT 0,

  -- Access Control
  access_granted BOOLEAN DEFAULT 0,
  access_granted_at TIMESTAMP,
  access_expires_at TIMESTAMP, -- NULL for permanent access

  -- Payment Details
  paid_amount_trac REAL NOT NULL,
  payment_tx_hash TEXT, -- Optional: actual on-chain tx if payment was made

  -- Timestamps
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (report_id) REFERENCES reports(report_id),
  UNIQUE(report_id, user_wallet) -- One access record per user per report
);

-- DKG-UAL to Premium Report Mapping
CREATE TABLE IF NOT EXISTS ual_premium_reports (
  mapping_id INTEGER PRIMARY KEY AUTOINCREMENT,
  proposal_ual TEXT NOT NULL, -- The proposal's DKG-UAL
  report_id INTEGER NOT NULL,
  report_ual TEXT NOT NULL, -- The premium report's DKG-UAL

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (report_id) REFERENCES reports(report_id),
  FOREIGN KEY (proposal_ual) REFERENCES proposals(ual),
  UNIQUE(proposal_ual, report_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_dkg_status ON proposals(dkg_status);
CREATE INDEX IF NOT EXISTS idx_proposals_ual ON proposals(ual);
CREATE INDEX IF NOT EXISTS idx_reports_referendum ON reports(referendum_index);
CREATE INDEX IF NOT EXISTS idx_reports_verification ON reports(verification_status);
CREATE INDEX IF NOT EXISTS idx_reports_submitter ON reports(submitter_wallet);
CREATE INDEX IF NOT EXISTS idx_reports_premium ON reports(is_premium);
CREATE INDEX IF NOT EXISTS idx_reports_ual ON reports(report_ual);
CREATE INDEX IF NOT EXISTS idx_premium_access_user ON premium_report_access(user_wallet);
CREATE INDEX IF NOT EXISTS idx_premium_access_report ON premium_report_access(report_id);
CREATE INDEX IF NOT EXISTS idx_ual_mappings_proposal ON ual_premium_reports(proposal_ual);
CREATE INDEX IF NOT EXISTS idx_ual_mappings_report ON ual_premium_reports(report_id);
`;

export default {
  createTablesSQL
};
