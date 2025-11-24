/**
 * Script to view all premium access records
 * Usage: node view-premium-access.js [all|active|revoked|reportId|wallet]
 *
 * Examples:
 *   node view-premium-access.js                    # View all access records
 *   node view-premium-access.js active             # View only active access
 *   node view-premium-access.js revoked            # View revoked access
 *   node view-premium-access.js 37                 # View access for report #37
 *   node view-premium-access.js 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
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
const filter = args[0] || 'all';

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
  let query = `
    SELECT
      pa.access_id,
      pa.report_id,
      pa.user_wallet,
      pa.access_granted,
      pa.paid_amount_trac as paid_amount_usdc,
      pa.payment_tx_hash,
      pa.requested_at,
      pa.access_granted_at,
      r.report_name,
      r.premium_price_trac as premium_price_usdc
    FROM premium_report_access pa
    LEFT JOIN reports r ON pa.report_id = r.report_id
  `;

  let params = [];
  let description = 'All Access Records';

  // Apply filters
  if (filter === 'active') {
    query += ' WHERE pa.access_granted = 1';
    description = 'Active Access Records';
  } else if (filter === 'revoked') {
    query += ' WHERE pa.access_granted = 0';
    description = 'Revoked Access Records';
  } else if (/^0x[a-fA-F0-9]{40}$/.test(filter)) {
    query += ' WHERE pa.user_wallet = ?';
    params = [filter.toLowerCase()];
    description = `Access Records for ${filter}`;
  } else if (!isNaN(parseInt(filter)) && filter !== 'all') {
    query += ' WHERE pa.report_id = ?';
    params = [parseInt(filter)];
    description = `Access Records for Report #${filter}`;
  }

  query += ' ORDER BY pa.requested_at DESC';

  const accessRecords = db.prepare(query).all(...params);

  console.log('\n' + '='.repeat(80));
  console.log(`📋 ${description}`);
  console.log('='.repeat(80));

  if (accessRecords.length === 0) {
    console.log('\n  No access records found\n');
  } else {
    accessRecords.forEach((record, index) => {
      console.log(`\n[${index + 1}] Access ID: ${record.access_id}`);
      console.log(`    Report #${record.report_id}: ${record.report_name || 'Unknown Report'}`);
      console.log(`    User: ${record.user_wallet}`);
      console.log(`    Price: $${record.premium_price_usdc || 'N/A'} USDC`);
      console.log(`    Paid: $${record.paid_amount_usdc || 'N/A'} USDC`);
      console.log(`    Status: ${record.access_granted ? '✅ ACTIVE' : '❌ REVOKED'}`);
      console.log(`    Requested: ${record.requested_at}`);
      console.log(`    Granted: ${record.access_granted_at || 'N/A'}`);
      if (record.payment_tx_hash) {
        console.log(`    TX Hash: ${record.payment_tx_hash}`);
      }
    });

    // Summary statistics
    const stats = {
      total: accessRecords.length,
      active: accessRecords.filter(r => r.access_granted === 1).length,
      revoked: accessRecords.filter(r => r.access_granted === 0).length
    };

    console.log('\n' + '='.repeat(80));
    console.log('📊 Summary Statistics:');
    console.log(`   Total Records: ${stats.total}`);
    console.log(`   Active Access: ${stats.active} ✅`);
    console.log(`   Revoked Access: ${stats.revoked} ❌`);
    console.log('='.repeat(80) + '\n');

    // Group by report
    if (filter === 'all' || filter === 'active' || filter === 'revoked') {
      const byReport = {};
      accessRecords.forEach(record => {
        if (!byReport[record.report_id]) {
          byReport[record.report_id] = {
            name: record.report_name,
            count: 0,
            active: 0
          };
        }
        byReport[record.report_id].count++;
        if (record.access_granted) {
          byReport[record.report_id].active++;
        }
      });

      console.log('📈 Access by Report:');
      Object.entries(byReport).forEach(([reportId, data]) => {
        console.log(`   Report #${reportId}: ${data.name || 'Unknown'}`);
        console.log(`     Total: ${data.count}, Active: ${data.active}`);
      });
      console.log('');
    }
  }

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
} finally {
  db.close();
  console.log('🔒 Database connection closed\n');
}
