/**
 * Add missing private_data columns to reports table
 */
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../../database/governance.db');

console.log('🔄 Adding missing columns to reports table...');
console.log('📁 Database path:', dbPath);

const db = new Database(dbPath);

try {
    // Check current columns
    const columns = db.prepare("PRAGMA table_info(reports)").all();
    const columnNames = columns.map(col => col.name);

    console.log('📋 Current columns:', columnNames.join(', '));

    // Add missing columns if they don't exist
    const columnsToAdd = [
        { name: 'private_jsonld_data', sql: 'ALTER TABLE reports ADD COLUMN private_jsonld_data TEXT' },
        { name: 'private_data_hash', sql: 'ALTER TABLE reports ADD COLUMN private_data_hash TEXT' },
        { name: 'private_data_size_bytes', sql: 'ALTER TABLE reports ADD COLUMN private_data_size_bytes INTEGER' }
    ];

    let addedCount = 0;

    for (const col of columnsToAdd) {
        if (!columnNames.includes(col.name)) {
            try {
                db.exec(col.sql);
                console.log(`✅ Added column: ${col.name}`);
                addedCount++;
            } catch (err) {
                console.error(`❌ Failed to add column ${col.name}:`, err.message);
            }
        } else {
            console.log(`✅ Column already exists: ${col.name}`);
        }
    }

    // Create index for private_data_hash
    try {
        db.exec('CREATE INDEX IF NOT EXISTS idx_reports_private_hash ON reports(private_data_hash)');
        console.log('✅ Created index: idx_reports_private_hash');
    } catch (err) {
        console.log('ℹ️  Index already exists or not needed');
    }

    console.log(`\n✨ Migration completed! Added ${addedCount} new column(s)`);

} catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
} finally {
    db.close();
}
