/**
 * Migration: Add payee_wallet column to reports table
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../../database/governance.db');
console.log('📁 Database path:', dbPath);

const db = new Database(dbPath);

try {
  console.log('🔄 Adding payee_wallet column to reports table...');

  // Check if column already exists
  const tableInfo = db.prepare('PRAGMA table_info(reports)').all();
  const columnExists = tableInfo.some(col => col.name === 'payee_wallet');

  if (columnExists) {
    console.log('✅ Column payee_wallet already exists');
  } else {
    db.prepare('ALTER TABLE reports ADD COLUMN payee_wallet TEXT').run();
    console.log('✅ Column payee_wallet added successfully');
  }

  console.log('✅ Migration completed');
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
} finally {
  db.close();
}
