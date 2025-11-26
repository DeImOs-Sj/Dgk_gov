import Database from 'better-sqlite3';

const db = new Database('./database/governance.db');

console.log('\n=== REPORTS TABLE ===');
const reports = db.prepare('SELECT report_id, referendum_index, report_name, is_premium, premium_price_trac FROM reports').all();
console.log(`Found ${reports.length} reports:`);
reports.forEach(r => {
  console.log(`  Report #${r.report_id}: "${r.report_name}" (Proposal ${r.referendum_index}, Premium: ${r.is_premium}, Price: ${r.premium_price_trac})`);
});

console.log('\n=== PROPOSALS TABLE ===');
const proposals = db.prepare('SELECT referendum_index, title, ual FROM proposals ORDER BY referendum_index').all();
console.log(`Found ${proposals.length} proposals:`);
proposals.forEach(p => {
  console.log(`  Proposal #${p.referendum_index}: "${p.title}"`);
  console.log(`    UAL: ${p.ual || 'Not published'}`);
});

db.close();
