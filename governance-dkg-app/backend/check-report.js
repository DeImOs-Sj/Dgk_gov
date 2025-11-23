import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../database/governance.db');
const db = new Database(dbPath);

const reportId = process.argv[2] || 13;

const report = db.prepare(`
  SELECT
    report_id,
    report_name,
    verification_status,
    report_ual,
    is_premium,
    premium_price_trac,
    payee_wallet,
    submitted_at,
    verified_at,
    dkg_published_at
  FROM reports
  WHERE report_id = ?
`).get(reportId);

if (report) {
  console.log('\n📊 Report Details:');
  console.log('─────────────────────────────────────────');
  console.log(`Report ID: ${report.report_id}`);
  console.log(`Name: ${report.report_name || 'N/A'}`);
  console.log(`Verification: ${report.verification_status}`);
  console.log(`Is Premium: ${report.is_premium ? 'Yes' : 'No'}`);
  console.log(`Price: ${report.premium_price_trac || 0} TRAC`);
  console.log(`Payee Wallet: ${report.payee_wallet || 'N/A'}`);
  console.log(`UAL: ${report.report_ual || 'NOT PUBLISHED'}`);
  console.log(`Submitted: ${report.submitted_at}`);
  console.log(`Verified: ${report.verified_at || 'Not verified'}`);
  console.log(`Published: ${report.dkg_published_at || 'Not published'}`);
  console.log('─────────────────────────────────────────\n');
} else {
  console.log(`\n❌ Report ${reportId} not found\n`);
}

db.close();
