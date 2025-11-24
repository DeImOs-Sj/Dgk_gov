/**
 * Migration Script: Convert TRAC pricing to USDC
 *
 * This script updates the database to reflect that premium reports
 * are priced in USDC (Base Sepolia) instead of TRAC tokens.
 *
 * Changes:
 * 1. Renames premium_price_trac -> premium_price_usdc (column rename)
 * 2. Renames paid_amount_trac -> paid_amount_usdc (column rename)
 * 3. Updates all display strings and comments
 *
 * Usage: node migrate-trac-to-usdc.js
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database path
const DB_PATH = path.join(__dirname, 'database', 'governance.db');
const BACKUP_PATH = path.join(__dirname, 'database', `governance.db.backup.${Date.now()}`);

console.log('🔄 TRAC to USDC Migration Script');
console.log('='.repeat(60));

// Create backup
console.log('\n📦 Creating backup...');
try {
  fs.copyFileSync(DB_PATH, BACKUP_PATH);
  console.log(`✅ Backup created: ${BACKUP_PATH}`);
} catch (error) {
  console.error('❌ Failed to create backup:', error.message);
  process.exit(1);
}

// Open database
let db;
try {
  db = new Database(DB_PATH);
  console.log('✅ Connected to database');
} catch (error) {
  console.error('❌ Failed to connect to database:', error.message);
  process.exit(1);
}

try {
  console.log('\n🔨 Starting migration...');

  // Start transaction
  db.exec('BEGIN TRANSACTION');

  // 1. Check if columns already exist
  const tableInfo = db.prepare("PRAGMA table_info(reports)").all();
  const hasTracColumn = tableInfo.some(col => col.name === 'premium_price_trac');
  const hasUsdcColumn = tableInfo.some(col => col.name === 'premium_price_usdc');

  if (!hasTracColumn && hasUsdcColumn) {
    console.log('⚠️  Migration already applied - database uses USDC columns');
    db.exec('ROLLBACK');
    process.exit(0);
  }

  // 2. Create new reports table with USDC columns
  console.log('\n📋 Step 1: Creating new reports table with USDC fields...');
  db.exec(`
    CREATE TABLE reports_new (
      report_id INTEGER PRIMARY KEY AUTOINCREMENT,
      referendum_index INTEGER NOT NULL,
      submitter_wallet TEXT NOT NULL,
      report_name TEXT,
      jsonld_data TEXT NOT NULL,
      data_size_bytes INTEGER NOT NULL,
      required_payment_trac REAL DEFAULT 0,
      payment_address TEXT,
      verification_status TEXT DEFAULT 'pending',
      ai_confidence REAL,
      ai_reasoning TEXT,
      ai_issues TEXT,
      report_ual TEXT,
      dkg_asset_id TEXT,
      dkg_tx_hash TEXT,
      dkg_block_explorer_url TEXT,
      is_premium INTEGER DEFAULT 0,
      premium_price_usdc REAL,
      payee_wallet TEXT,
      author_type TEXT DEFAULT 'community',
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      dkg_published_at TIMESTAMP,
      FOREIGN KEY (referendum_index) REFERENCES proposals(referendum_index)
    )
  `);
  console.log('✅ New table created');

  // 3. Copy data from old table to new table
  console.log('\n📋 Step 2: Migrating data...');
  db.exec(`
    INSERT INTO reports_new SELECT * FROM reports
  `);

  const reportCount = db.prepare('SELECT COUNT(*) as count FROM reports_new').get().count;
  console.log(`✅ Migrated ${reportCount} reports`);

  // 4. Drop old table and rename new table
  console.log('\n📋 Step 3: Replacing old table...');
  db.exec('DROP TABLE reports');
  db.exec('ALTER TABLE reports_new RENAME TO reports');
  console.log('✅ Table replaced');

  // 5. Update premium_access table
  console.log('\n📋 Step 4: Updating premium_access table...');
  const accessTableInfo = db.prepare("PRAGMA table_info(premium_access)").all();
  const hasTracAccessColumn = accessTableInfo.some(col => col.name === 'paid_amount_trac');

  if (hasTracAccessColumn) {
    db.exec(`
      CREATE TABLE premium_access_new (
        access_id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_id INTEGER NOT NULL,
        user_wallet TEXT NOT NULL,
        payment_signature TEXT,
        payment_message TEXT,
        paid_amount_usdc REAL,
        payment_tx_hash TEXT,
        access_granted INTEGER DEFAULT 0,
        requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        granted_at TIMESTAMP,
        FOREIGN KEY (report_id) REFERENCES reports(report_id)
      )
    `);

    db.exec(`
      INSERT INTO premium_access_new SELECT * FROM premium_access
    `);

    const accessCount = db.prepare('SELECT COUNT(*) as count FROM premium_access_new').get().count;
    console.log(`✅ Migrated ${accessCount} access records`);

    db.exec('DROP TABLE premium_access');
    db.exec('ALTER TABLE premium_access_new RENAME TO premium_access');
    console.log('✅ premium_access table updated');
  }

  // 6. Show summary of premium reports
  console.log('\n📊 Summary of Premium Reports:');
  const premiumReports = db.prepare(`
    SELECT report_id, report_name, premium_price_usdc, payee_wallet
    FROM reports
    WHERE is_premium = 1
  `).all();

  if (premiumReports.length > 0) {
    premiumReports.forEach(report => {
      console.log(`   Report #${report.report_id}: $${report.premium_price_usdc} USDC`);
      console.log(`     Payee: ${report.payee_wallet || 'NOT SET'}`);
    });
  } else {
    console.log('   No premium reports found');
  }

  // Commit transaction
  db.exec('COMMIT');

  console.log('\n✅ Migration completed successfully!');
  console.log('\n📝 Summary:');
  console.log(`   - Backup saved to: ${path.basename(BACKUP_PATH)}`);
  console.log(`   - Renamed: premium_price_trac -> premium_price_usdc`);
  console.log(`   - Renamed: paid_amount_trac -> paid_amount_usdc`);
  console.log(`   - ${reportCount} reports migrated`);
  console.log(`   - ${premiumReports.length} premium reports found`);

  console.log('\n⚠️  Next Steps:');
  console.log('   1. Restart your backend server');
  console.log('   2. Update premium report prices to use USDC values');
  console.log('   3. Test the X402 payment flow');
  console.log('');

} catch (error) {
  // Rollback on error
  db.exec('ROLLBACK');
  console.error('\n❌ Migration failed:', error.message);
  console.error('   Transaction rolled back - no changes made');
  console.error(`\n💾 Restore backup if needed:`);
  console.error(`   cp "${BACKUP_PATH}" "${DB_PATH}"`);
  process.exit(1);
} finally {
  db.close();
  console.log('🔒 Database connection closed\n');
}
