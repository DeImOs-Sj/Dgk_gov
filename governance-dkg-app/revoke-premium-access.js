/**
 * Script to revoke premium report access
 * Usage: node revoke-premium-access.js [all|reportId|wallet]
 *
 * Examples:
 *   node revoke-premium-access.js all                                    # Revoke all access
 *   node revoke-premium-access.js 37                                     # Revoke access to report #37
 *   node revoke-premium-access.js 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266  # Revoke user's access
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database path
const DB_PATH = path.join(__dirname, 'database', 'governance.db');

// Create readline interface for confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline question
function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// Get command line arguments
const args = process.argv.slice(2);
const target = args[0];

// Validate arguments
if (!target) {
  console.error('❌ Error: Missing required argument');
  console.log('Usage: node revoke-premium-access.js [all|reportId|wallet]');
  console.log('\nExamples:');
  console.log('  node revoke-premium-access.js all                                    # Revoke all access');
  console.log('  node revoke-premium-access.js 37                                     # Revoke access to report #37');
  console.log('  node revoke-premium-access.js 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266  # Revoke user access');
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

async function main() {
  let transactionStarted = false;

  try {
    let targetType;
    let accessRecords = [];

    // Determine target type and get records
    if (target.toLowerCase() === 'all') {
      targetType = 'all';
      accessRecords = db.prepare(`
        SELECT
          pa.access_id,
          pa.report_id,
          pa.user_wallet,
          pa.access_granted,
          pa.requested_at,
          pa.access_granted_at,
          r.report_name,
          r.premium_price_trac as premium_price_usdc
        FROM premium_report_access pa
        LEFT JOIN reports r ON pa.report_id = r.report_id
        WHERE pa.access_granted = 1
      `).all();
    } else if (/^0x[a-fA-F0-9]{40}$/.test(target)) {
      targetType = 'wallet';
      accessRecords = db.prepare(`
        SELECT
          pa.access_id,
          pa.report_id,
          pa.user_wallet,
          pa.access_granted,
          pa.requested_at,
          pa.access_granted_at,
          r.report_name,
          r.premium_price_trac as premium_price_usdc
        FROM premium_report_access pa
        LEFT JOIN reports r ON pa.report_id = r.report_id
        WHERE pa.user_wallet = ? AND pa.access_granted = 1
      `).all(target.toLowerCase());
    } else if (!isNaN(parseInt(target))) {
      targetType = 'report';
      const reportId = parseInt(target);
      accessRecords = db.prepare(`
        SELECT
          pa.access_id,
          pa.report_id,
          pa.user_wallet,
          pa.access_granted,
          pa.requested_at,
          pa.access_granted_at,
          r.report_name,
          r.premium_price_trac as premium_price_usdc
        FROM premium_report_access pa
        LEFT JOIN reports r ON pa.report_id = r.report_id
        WHERE pa.report_id = ? AND pa.access_granted = 1
      `).all(reportId);
    } else {
      console.error('❌ Error: Invalid target. Must be "all", a report ID, or a wallet address');
      process.exit(1);
    }

    // Check if any records found
    if (accessRecords.length === 0) {
      console.log('\n✅ No active access records found to revoke');
      rl.close();
      db.close();
      process.exit(0);
    }

    // Display records to be revoked
    console.log('\n📋 Access Records to be Revoked:');
    console.log('='.repeat(80));

    accessRecords.forEach(record => {
      console.log(`\n  Access ID: ${record.access_id}`);
      console.log(`  Report #${record.report_id}: ${record.report_name || 'Unknown'}`);
      console.log(`  User: ${record.user_wallet}`);
      console.log(`  Price: $${record.premium_price_usdc || 'N/A'} USDC`);
      console.log(`  Granted: ${record.access_granted_at || 'Unknown'}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log(`\n⚠️  WARNING: This will revoke access for ${accessRecords.length} record(s)`);
    console.log('   Users will need to pay again to access these reports\n');

    // Ask for confirmation
    const answer = await question('Are you sure you want to revoke access? (yes/no): ');

    if (answer.toLowerCase() !== 'yes') {
      console.log('\n❌ Revocation cancelled');
      rl.close();
      db.close();
      process.exit(0);
    }

    // Start transaction
    db.exec('BEGIN TRANSACTION');
    transactionStarted = true;

    let revokeCount = 0;

    // Revoke access based on target type
    if (targetType === 'all') {
      const result = db.prepare(`
        UPDATE premium_report_access
        SET access_granted = 0
        WHERE access_granted = 1
      `).run();
      revokeCount = result.changes;
    } else if (targetType === 'wallet') {
      const result = db.prepare(`
        UPDATE premium_report_access
        SET access_granted = 0
        WHERE user_wallet = ? AND access_granted = 1
      `).run(target.toLowerCase());
      revokeCount = result.changes;
    } else if (targetType === 'report') {
      const reportId = parseInt(target);
      const result = db.prepare(`
        UPDATE premium_report_access
        SET access_granted = 0
        WHERE report_id = ? AND access_granted = 1
      `).run(reportId);
      revokeCount = result.changes;
    }

    // Commit transaction
    db.exec('COMMIT');
    transactionStarted = false;

    console.log(`\n✅ Successfully revoked access for ${revokeCount} record(s)`);

    // Show summary
    console.log('\n📊 Summary:');
    console.log(`   Target: ${targetType === 'all' ? 'All users' : targetType === 'wallet' ? target : `Report #${target}`}`);
    console.log(`   Records revoked: ${revokeCount}`);
    console.log('   Status: Access revoked (access_granted = 0)');

    // Show remaining active access
    const remainingAccess = db.prepare(`
      SELECT COUNT(*) as count
      FROM premium_report_access
      WHERE access_granted = 1
    `).get();

    console.log(`\n📈 Remaining active access records: ${remainingAccess.count}`);

    // Option to delete records permanently
    console.log('\n💡 Note: Access records are preserved with access_granted = 0');
    const deleteAnswer = await question('\nDo you want to DELETE these records permanently? (yes/no): ');

    if (deleteAnswer.toLowerCase() === 'yes') {
      db.exec('BEGIN TRANSACTION');
      transactionStarted = true;

      let deleteCount = 0;

      if (targetType === 'all') {
        const result = db.prepare(`
          DELETE FROM premium_report_access
          WHERE access_granted = 0
        `).run();
        deleteCount = result.changes;
      } else if (targetType === 'wallet') {
        const result = db.prepare(`
          DELETE FROM premium_report_access
          WHERE user_wallet = ? AND access_granted = 0
        `).run(target.toLowerCase());
        deleteCount = result.changes;
      } else if (targetType === 'report') {
        const reportId = parseInt(target);
        const result = db.prepare(`
          DELETE FROM premium_report_access
          WHERE report_id = ? AND access_granted = 0
        `).run(reportId);
        deleteCount = result.changes;
      }

      db.exec('COMMIT');
      transactionStarted = false;

      console.log(`\n✅ Successfully deleted ${deleteCount} record(s) permanently`);
    } else {
      console.log('\n✅ Records preserved (can be restored if needed)');
    }

    console.log('\n💾 Changes committed to database');

  } catch (error) {
    // Rollback on error (only if transaction was started)
    if (transactionStarted) {
      try {
        db.exec('ROLLBACK');
        console.error('   Transaction rolled back - no changes made');
      } catch (rollbackError) {
        // Ignore rollback errors if transaction wasn't active
      }
    }
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    db.close();
    console.log('🔒 Database connection closed\n');
  }
}

// Run main function
main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
