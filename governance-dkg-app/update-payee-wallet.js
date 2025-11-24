/**
 * Script to update payee wallet address for premium reports
 * Usage: node update-payee-wallet.js [reportId] [newPayeeWallet]
 *
 * Examples:
 *   node update-payee-wallet.js 37 0xe717d34064e45af53c8afc2d4a64144803e2428f
 *   node update-payee-wallet.js all 0xe717d34064e45af53c8afc2d4a64144803e2428f
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database path
const DB_PATH = path.join(__dirname, 'database', 'governance.db');

// Get command line arguments
const args = process.argv.slice(2);
const reportIdArg = args[0];
const newPayeeWallet = args[1];

// Validate arguments
if (!reportIdArg || !newPayeeWallet) {
  console.error('❌ Error: Missing required arguments');
  console.log('Usage: node update-payee-wallet.js [reportId|all] [newPayeeWallet]');
  console.log('\nExamples:');
  console.log('  node update-payee-wallet.js 37 0xe717d34064e45af53c8afc2d4a64144803e2428f');
  console.log('  node update-payee-wallet.js all 0xe717d34064e45af53c8afc2d4a64144803e2428f');
  process.exit(1);
}

// Validate Ethereum address format
if (!/^0x[a-fA-F0-9]{40}$/.test(newPayeeWallet)) {
  console.error('❌ Error: Invalid Ethereum address format');
  console.error('   Address must be 40 hex characters with 0x prefix');
  process.exit(1);
}

// Open database
let db;
try {
  db = new Database(DB_PATH);
  console.log('✅ Connected to database:', DB_PATH);
} catch (error) {
  console.error('❌ Failed to connect to database:', error.message);
  process.exit(1);
}

try {
  // Start transaction
  db.exec('BEGIN TRANSACTION');

  if (reportIdArg.toLowerCase() === 'all') {
    // Update all premium reports
    const stmt = db.prepare(`
      UPDATE reports
      SET payee_wallet = ?
      WHERE is_premium = 1
    `);

    const result = stmt.run(newPayeeWallet);

    console.log(`\n✅ Updated payee wallet for ${result.changes} premium report(s)`);
    console.log(`   New payee wallet: ${newPayeeWallet}`);

    // Show updated reports
    const reports = db.prepare(`
      SELECT report_id, report_name, payee_wallet
      FROM reports
      WHERE is_premium = 1
    `).all();

    console.log('\n📋 Updated reports:');
    reports.forEach(report => {
      console.log(`   Report #${report.report_id}: ${report.report_name}`);
      console.log(`   Payee: ${report.payee_wallet}`);
    });
  } else {
    // Update specific report
    const reportId = parseInt(reportIdArg);

    if (isNaN(reportId)) {
      throw new Error('Report ID must be a number or "all"');
    }

    // Check if report exists
    const report = db.prepare('SELECT * FROM reports WHERE report_id = ?').get(reportId);

    if (!report) {
      throw new Error(`Report #${reportId} not found`);
    }

    if (!report.is_premium) {
      console.warn(`⚠️  Warning: Report #${reportId} is not a premium report`);
    }

    console.log(`\n📝 Report #${reportId}: ${report.report_name}`);
    console.log(`   Current payee wallet: ${report.payee_wallet || 'NULL'}`);

    // Update the payee wallet
    const stmt = db.prepare(`
      UPDATE reports
      SET payee_wallet = ?
      WHERE report_id = ?
    `);

    const result = stmt.run(newPayeeWallet, reportId);

    if (result.changes === 0) {
      throw new Error('Failed to update report');
    }

    console.log(`   New payee wallet: ${newPayeeWallet}`);
    console.log(`\n✅ Successfully updated payee wallet for report #${reportId}`);
  }

  // Commit transaction
  db.exec('COMMIT');

  console.log('\n💾 Changes committed to database');

} catch (error) {
  // Rollback on error
  db.exec('ROLLBACK');
  console.error('\n❌ Error:', error.message);
  console.error('   Transaction rolled back - no changes made');
  process.exit(1);
} finally {
  db.close();
  console.log('🔒 Database connection closed\n');
}
