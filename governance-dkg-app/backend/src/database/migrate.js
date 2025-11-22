/**
 * Database Migration Script
 * Adds new premium report columns to existing database
 */
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use absolute path to database
const dbPath = '/home/shlok/Desktop/my_dkg_node/opengov-dkg-app/governance-dkg-app/database/governance.db';

console.log('🔄 Starting database migration...');
console.log('📁 Database path:', dbPath);

const db = new Database(dbPath);

try {
  // Check if is_premium column already exists
  const tableInfo = db.prepare("PRAGMA table_info(reports)").all();
  const columnNames = tableInfo.map(col => col.name);

  console.log('📋 Current columns:', columnNames.join(', '));

  // Add missing columns to reports table
  const columnsToAdd = [
    { name: 'is_premium', sql: 'ALTER TABLE reports ADD COLUMN is_premium BOOLEAN DEFAULT 0' },
    { name: 'premium_price_trac', sql: 'ALTER TABLE reports ADD COLUMN premium_price_trac REAL' },
    { name: 'author_type', sql: "ALTER TABLE reports ADD COLUMN author_type TEXT DEFAULT 'community'" }
  ];

  let addedColumns = 0;

  for (const column of columnsToAdd) {
    if (!columnNames.includes(column.name)) {
      console.log(`➕ Adding column: ${column.name}`);
      db.exec(column.sql);
      addedColumns++;
    } else {
      console.log(`✅ Column already exists: ${column.name}`);
    }
  }

  // Create premium_report_access table if it doesn't exist
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  const tableNames = tables.map(t => t.name);

  if (!tableNames.includes('premium_report_access')) {
    console.log('📦 Creating premium_report_access table...');
    db.exec(`
      CREATE TABLE premium_report_access (
        access_id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_id INTEGER NOT NULL,
        user_wallet TEXT NOT NULL,

        -- Payment Verification (Signed Message)
        payment_signature TEXT NOT NULL,
        payment_message TEXT NOT NULL,
        signature_verified BOOLEAN DEFAULT 0,

        -- Access Control
        access_granted BOOLEAN DEFAULT 0,
        access_granted_at TIMESTAMP,
        access_expires_at TIMESTAMP,

        -- Payment Details
        paid_amount_trac REAL NOT NULL,
        payment_tx_hash TEXT,

        -- Timestamps
        requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (report_id) REFERENCES reports(report_id),
        UNIQUE(report_id, user_wallet)
      )
    `);
    console.log('✅ Created premium_report_access table');
  } else {
    console.log('✅ Table already exists: premium_report_access');
  }

  // Create ual_premium_reports table if it doesn't exist
  if (!tableNames.includes('ual_premium_reports')) {
    console.log('📦 Creating ual_premium_reports table...');
    db.exec(`
      CREATE TABLE ual_premium_reports (
        mapping_id INTEGER PRIMARY KEY AUTOINCREMENT,
        proposal_ual TEXT NOT NULL,
        report_id INTEGER NOT NULL,
        report_ual TEXT NOT NULL,

        -- Metadata
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (report_id) REFERENCES reports(report_id),
        FOREIGN KEY (proposal_ual) REFERENCES proposals(ual),
        UNIQUE(proposal_ual, report_id)
      )
    `);
    console.log('✅ Created ual_premium_reports table');
  } else {
    console.log('✅ Table already exists: ual_premium_reports');
  }

  console.log('\n✨ Migration completed successfully!');
  console.log(`   - Added ${addedColumns} new column(s)`);
  console.log('   - All tables are up to date\n');

} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
} finally {
  db.close();
}
