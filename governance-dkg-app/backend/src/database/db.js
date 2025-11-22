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
        data_size_bytes, required_payment_trac, payment_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    return stmt.run(
      report.referendum_index,
      report.submitter_wallet,
      report.report_name,
      report.jsonld_data,
      report.data_size_bytes,
      report.required_payment_trac,
      report.payment_address
    );
  },

  // Get reports for a proposal
  getByProposal: (referendumIndex) => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM reports WHERE referendum_index = ? ORDER BY submitted_at DESC').all(referendumIndex);
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

  // Get all reports
  getAll: () => {
    const db = getDatabase();
    return db.prepare('SELECT * FROM reports ORDER BY submitted_at DESC').all();
  }
};

export default {
  getDatabase,
  initializeDatabase,
  closeDatabase,
  proposalQueries,
  reportQueries
};
