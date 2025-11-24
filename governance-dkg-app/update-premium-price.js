/**
 * Update Premium Report Prices to $0.10
 */
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'database/governance.db');

console.log('📁 Database path:', dbPath);

const db = new Database(dbPath);

try {
  // Get all premium reports
  console.log('\n📋 Current Premium Reports:');
  const premiumReports = db.prepare(`
    SELECT report_id, report_name, premium_price_trac, payee_wallet
    FROM reports
    WHERE is_premium = 1
  `).all();

  if (premiumReports.length === 0) {
    console.log('No premium reports found.');
  } else {
    premiumReports.forEach(report => {
      console.log(`\nReport ID: ${report.report_id}`);
      console.log(`Name: ${report.report_name}`);
      console.log(`Current Price: $${report.premium_price_trac}`);
      console.log(`Payee Wallet: ${report.payee_wallet || 'Not set'}`);
    });

    // Update all premium reports to $0.10
    console.log('\n💰 Updating all premium reports to $0.10...');
    const updateStmt = db.prepare(`
      UPDATE reports
      SET premium_price_trac = 0.10
      WHERE is_premium = 1
    `);

    const result = updateStmt.run();
    console.log(`✅ Updated ${result.changes} premium report(s)`);

    // Show updated reports
    console.log('\n✅ Updated Premium Reports:');
    const updatedReports = db.prepare(`
      SELECT report_id, report_name, premium_price_trac
      FROM reports
      WHERE is_premium = 1
    `).all();

    updatedReports.forEach(report => {
      console.log(`\nReport ID: ${report.report_id}`);
      console.log(`Name: ${report.report_name}`);
      console.log(`New Price: $${report.premium_price_trac}`);
    });
  }
} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  db.close();
  console.log('\n🔒 Database connection closed');
}
