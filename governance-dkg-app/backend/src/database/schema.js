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

  -- Payment Info
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_dkg_status ON proposals(dkg_status);
CREATE INDEX IF NOT EXISTS idx_proposals_ual ON proposals(ual);
CREATE INDEX IF NOT EXISTS idx_reports_referendum ON reports(referendum_index);
CREATE INDEX IF NOT EXISTS idx_reports_verification ON reports(verification_status);
CREATE INDEX IF NOT EXISTS idx_reports_submitter ON reports(submitter_wallet);
`;

export default {
  createTablesSQL
};
