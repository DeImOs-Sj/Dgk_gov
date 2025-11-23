/**
 * Database Connection and Helper Functions
 */
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { createTablesSQL } from './schema.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine database path
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../../database/governance.db');

console.log('📁 Database path:', dbPath);

// Create database instance
let db = null;

export function getDatabase() {
  if (!db) {
    db = new Database(dbPath, { verbose: console.log });
    db.pragma('journal_mode = WAL');
    console.log('✅ Database connection established');
  }
  return db;
}

export function initializeDatabase() {
  const database = getDatabase();

  // Create tables
  database.exec(createTablesSQL);
  console.log('✅ Database schema initialized');

  return database;
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    console.log('🔒 Database connection closed');
  }
}

// Proposal CRUD operations
export const proposalQueries = {
  // Insert proposal
  insert: (proposal) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO proposals (
        referendum_index, title, summary, status, origin,
        proposer_address, beneficiary_address, ayes_amount, nays_amount,
        requested_amount, treasury_proposal_id, created_block, latest_block,
        created_at, updated_at, proposal_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    return stmt.run(
      proposal.referendum_index,
      proposal.title,
      proposal.summary,
      proposal.status,
      proposal.origin,
      proposal.proposer_address,
      proposal.beneficiary_address,
      proposal.ayes_amount,
      proposal.nays_amount,
      proposal.requested_amount,
      proposal.treasury_proposal_id,
      proposal.created_block,
      proposal.latest_block,
      proposal.created_at,
      proposal.updated_at,
      JSON.stringify(proposal)
    );
  },

  // Get all proposals
  getAll: () => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM proposals ORDER BY referendum_index DESC').all();
  },

  // Get proposal by index
  getByIndex: (index) => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM proposals WHERE referendum_index = ?').get(index);
  },

  // Update DKG status
  updateDKGStatus: (index, ual, assetId, txHash, status, explorerUrl) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE proposals
      SET ual = ?, dkg_asset_id = ?, dkg_tx_hash = ?,
          dkg_status = ?, block_explorer_url = ?, published_at = CURRENT_TIMESTAMP
      WHERE referendum_index = ?
    `);
    return stmt.run(ual, assetId, txHash, status, explorerUrl, index);
  },

  // Get proposals with UAL
  getPublished: () => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM proposals WHERE ual IS NOT NULL ORDER BY referendum_index DESC').all();
  }
};

// Report CRUD operations
export const reportQueries = {
  // Insert report
  insert: (report) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO reports (
        referendum_index, submitter_wallet, report_name, jsonld_data,
        data_size_bytes, required_payment_trac, payment_address,
        is_premium, premium_price_trac, payee_wallet, author_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    return stmt.run(
      report.referendum_index,
      report.submitter_wallet,
      report.report_name,
      report.jsonld_data,
      report.data_size_bytes,
      report.required_payment_trac,
      report.payment_address,
      report.is_premium || 0,
      report.premium_price_trac || null,
      report.payee_wallet || null,
      report.author_type || 'community'
    );
  },

  // Get reports for a proposal
  getByProposal: (referendumIndex) => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM reports WHERE referendum_index = ? ORDER BY submitted_at DESC').all(referendumIndex);
  },

  // Get premium reports for a proposal
  getPremiumByProposal: (referendumIndex) => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM reports WHERE referendum_index = ? AND is_premium = 1 ORDER BY submitted_at DESC').all(referendumIndex);
  },

  // Get report by ID
  getById: (reportId) => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM reports WHERE report_id = ?').get(reportId);
  },

  // Update verification status
  updateVerification: (reportId, status, confidence, reasoning, issues) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE reports
      SET verification_status = ?, ai_confidence = ?, ai_reasoning = ?,
          verification_issues = ?, verified_at = CURRENT_TIMESTAMP
      WHERE report_id = ?
    `);
    return stmt.run(
      status,
      confidence,
      reasoning,
      JSON.stringify(issues || []),
      reportId
    );
  },

  // Update DKG publication
  updateDKGPublication: (reportId, ual, assetId, txHash, explorerUrl) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE reports
      SET report_ual = ?, dkg_asset_id = ?, dkg_tx_hash = ?,
          dkg_block_explorer_url = ?, dkg_published_at = CURRENT_TIMESTAMP
      WHERE report_id = ?
    `);
    return stmt.run(ual, assetId, txHash, explorerUrl, reportId);
  },

  // Update DKG info (flexible object-based update)
  updateDKGInfo: (reportId, dkgInfo) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE reports
      SET report_ual = ?, dkg_asset_id = ?, dkg_tx_hash = ?,
          dkg_block_explorer_url = ?, dkg_published_at = ?
      WHERE report_id = ?
    `);
    return stmt.run(
      dkgInfo.report_ual,
      dkgInfo.dkg_asset_id,
      dkgInfo.dkg_tx_hash || null,
      dkgInfo.dkg_block_explorer_url || null,
      dkgInfo.dkg_published_at || new Date().toISOString(),
      reportId
    );
  },

  // Get all reports
  getAll: () => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM reports ORDER BY submitted_at DESC').all();
  }
};

// Premium Report Access CRUD operations
export const premiumAccessQueries = {
  // Request access to premium report
  requestAccess: (access) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO premium_report_access (
        report_id, user_wallet, payment_signature, payment_message,
        paid_amount_trac, payment_tx_hash
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    return stmt.run(
      access.report_id,
      access.user_wallet,
      access.payment_signature,
      access.payment_message,
      access.paid_amount_trac,
      access.payment_tx_hash || null
    );
  },

  // Grant access after signature verification
  grantAccess: (accessId) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE premium_report_access
      SET signature_verified = 1, access_granted = 1, access_granted_at = CURRENT_TIMESTAMP
      WHERE access_id = ?
    `);
    return stmt.run(accessId);
  },

  // Check if user has access to a report
  hasAccess: (reportId, userWallet) => {
    const db = getDatabase();
    const result = db.prepare(`
      SELECT * FROM premium_report_access
      WHERE report_id = ? AND user_wallet = ? AND access_granted = 1
    `).get(reportId, userWallet);
    return !!result;
  },

  // Get access record
  getAccessRecord: (reportId, userWallet) => {
    const db = getDatabase();
    return db.prepare(`
      SELECT * FROM premium_report_access
      WHERE report_id = ? AND user_wallet = ?
    `).get(reportId, userWallet);
  },

  // Get all access records for a report
  getAccessByReport: (reportId) => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM premium_report_access WHERE report_id = ? ORDER BY requested_at DESC').all(reportId);
  },

  // Get all access records for a user
  getAccessByUser: (userWallet) => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM premium_report_access WHERE user_wallet = ? ORDER BY requested_at DESC').all(userWallet);
  }
};

// UAL to Premium Report Mapping CRUD operations
export const ualMappingQueries = {
  // Create mapping
  createMapping: (proposalUAL, reportId, reportUAL) => {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO ual_premium_reports (proposal_ual, report_id, report_ual)
      VALUES (?, ?, ?)
    `);
    return stmt.run(proposalUAL, reportId, reportUAL);
  },

  // Get all premium reports for a proposal UAL
  getByProposalUAL: (proposalUAL) => {
    const db = getDatabase();
    return db.prepare(`
      SELECT m.*, r.*
      FROM ual_premium_reports m
      JOIN reports r ON m.report_id = r.report_id
      WHERE m.proposal_ual = ?
      ORDER BY m.created_at DESC
    `).all(proposalUAL);
  },

  // Get mapping by report ID
  getByReportId: (reportId) => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM ual_premium_reports WHERE report_id = ?').get(reportId);
  }
};

export default {
  getDatabase,
  initializeDatabase,
  closeDatabase,
  proposalQueries,
  reportQueries,
  premiumAccessQueries,
  ualMappingQueries
};
