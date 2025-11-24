/**
 * Script to restore previously revoked premium access
 * Usage: node restore-premium-access.js [accessId|all]
 *
 * Examples:
 *   node restore-premium-access.js 5              # Restore access record #5
 *   node restore-premium-access.js all            # Restore all revoked access
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
  console.log('Usage: node restore-premium-access.js [accessId|all]');
  console.log('\nExamples:');
  console.log('  node restore-premium-access.js 5              # Restore access record #5');
  console.log('  node restore-premium-access.js all            # Restore all revoked access');
  console.log('\n💡 Tip: Use "node view-premium-access.js revoked" to see revoked records');
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
    let accessRecords = [];

    // Get revoked access records
    if (target.toLowerCase() === 'all') {
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
        WHERE pa.access_granted = 0
      `).all();
    } else if (!isNaN(parseInt(target))) {
      const accessId = parseInt(target);
      const record = db.prepare(`
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
        WHERE pa.access_id = ?
      `).get(accessId);

      if (!record) {
        console.error(`❌ Error: Access record #${accessId} not found`);
        process.exit(1);
      }

      if (record.access_granted === 1) {
        console.log(`\n✅ Access record #${accessId} is already active`);
        console.log(`   User: ${record.user_wallet}`);
        console.log(`   Report #${record.report_id}: ${record.report_name}`);
        process.exit(0);
      }

      accessRecords = [record];
    } else {
      console.error('❌ Error: Invalid target. Must be "all" or an access ID number');
      process.exit(1);
    }

    // Check if any records found
    if (accessRecords.length === 0) {
      console.log('\n✅ No revoked access records found to restore');
      rl.close();
      db.close();
      process.exit(0);
    }

    // Display records to be restored
    console.log('\n📋 Access Records to be Restored:');
    console.log('='.repeat(80));

    accessRecords.forEach(record => {
      console.log(`\n  Access ID: ${record.access_id}`);
      console.log(`  Report #${record.report_id}: ${record.report_name || 'Unknown'}`);
      console.log(`  User: ${record.user_wallet}`);
      console.log(`  Price: $${record.premium_price_usdc || 'N/A'} USDC`);
      console.log(`  Originally Granted: ${record.access_granted_at || 'Unknown'}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log(`\n✅ This will restore access for ${accessRecords.length} record(s)`);
    console.log('   Users will regain access to these premium reports\n');

    // Ask for confirmation
    const answer = await question('Are you sure you want to restore access? (yes/no): ');

    if (answer.toLowerCase() !== 'yes') {
      console.log('\n❌ Restoration cancelled');
      rl.close();
      db.close();
      process.exit(0);
    }

    // Start transaction
    db.exec('BEGIN TRANSACTION');
    transactionStarted = true;

    let restoreCount = 0;

    // Restore access
    if (target.toLowerCase() === 'all') {
      const result = db.prepare(`
        UPDATE premium_report_access
        SET access_granted = 1,
            access_granted_at = CURRENT_TIMESTAMP
        WHERE access_granted = 0
      `).run();
      restoreCount = result.changes;
    } else {
      const accessId = parseInt(target);
      const result = db.prepare(`
        UPDATE premium_report_access
        SET access_granted = 1,
            access_granted_at = CURRENT_TIMESTAMP
        WHERE access_id = ?
      `).run(accessId);
      restoreCount = result.changes;
    }

    // Commit transaction
    db.exec('COMMIT');
    transactionStarted = false;

    console.log(`\n✅ Successfully restored access for ${restoreCount} record(s)`);

    // Show summary
    console.log('\n📊 Summary:');
    console.log(`   Target: ${target.toLowerCase() === 'all' ? 'All revoked records' : `Access ID #${target}`}`);
    console.log(`   Records restored: ${restoreCount}`);
    console.log(`   Status: Access granted (access_granted = 1)`);

    // Show total active access
    const activeAccess = db.prepare(`
      SELECT COUNT(*) as count
      FROM premium_report_access
      WHERE access_granted = 1
    `).get();

    console.log(`\n📈 Total active access records: ${activeAccess.count}`);
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
