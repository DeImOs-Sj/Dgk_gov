/**
 * Create Premium Report for Proposal with DKG UAL
 * Usage: node create-premium-report.js
 */
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'database/governance.db');

console.log('📁 Database path:', dbPath);

const db = new Database(dbPath);

// Configuration
const CONFIG = {
  referendum_index: 1765,
  dkg_ual: 'did:dkg:otp:20430/0xcdb28ssffe93ed34d0fdesadcff10sssdvxswb00a31dbdssfcffbd5d37/401123',
  report_name: 'Premium Report for Proposal 1765',
  submitter_wallet: '0xe717d34064e45af53c8afc2d4a64144803e2428f', // Update if needed
  payee_wallet: '0xe717d34064e45af53c8afc2d4a64144803e2428f', // Wallet that will receive payments
  premium_price: 0.10, // $0.10 in USDC
  author_type: 'expert' // Can be 'expert' or 'community'
};

// Sample JSON-LD data for the report
const sampleJsonLD = {
  "@context": "https://schema.org",
  "@type": "Report",
  "name": CONFIG.report_name,
  "description": "Comprehensive analysis and expert review of proposal 1765",
  "author": {
    "@type": "Organization",
    "name": "Expert Analysis Team"
  },
  "datePublished": new Date().toISOString(),
  "about": {
    "@type": "GovernanceProposal",
    "identifier": CONFIG.referendum_index,
    "name": `Polkadot Proposal ${CONFIG.referendum_index}`
  },
  "mainEntity": {
    "@type": "AnalysisResult",
    "assessment": "This premium report provides in-depth analysis including feasibility study, risk assessment, and expert recommendations.",
    "categories": [
      "Technical Feasibility",
      "Financial Impact",
      "Community Benefit",
      "Risk Assessment"
    ]
  }
};

try {
  console.log('\n📊 Creating Premium Report with Configuration:');
  console.log(JSON.stringify(CONFIG, null, 2));

  // Step 1: Insert the premium report
  console.log('\n📝 Step 1: Inserting premium report into database...');

  const insertStmt = db.prepare(`
    INSERT INTO reports (
      referendum_index, submitter_wallet, report_name, jsonld_data,
      data_size_bytes, required_payment_trac, payment_address,
      is_premium, premium_price_trac, payee_wallet, author_type
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const jsonldString = JSON.stringify(sampleJsonLD, null, 2);
  const dataSizeBytes = Buffer.byteLength(jsonldString, 'utf8');

  const insertResult = insertStmt.run(
    CONFIG.referendum_index,
    CONFIG.submitter_wallet,
    CONFIG.report_name,
    jsonldString,
    dataSizeBytes,
    0, // required_payment_trac (not used for premium reports with USDC)
    null, // payment_address (not used for x402 payments)
    1, // is_premium
    CONFIG.premium_price,
    CONFIG.payee_wallet,
    CONFIG.author_type
  );

  const reportId = insertResult.lastInsertRowid;
  console.log(`✅ Premium report created with ID: ${reportId}`);

  // Step 2: Update with DKG information
  console.log('\n🔗 Step 2: Updating report with DKG UAL information...');

  const updateStmt = db.prepare(`
    UPDATE reports
    SET report_ual = ?,
        dkg_asset_id = ?,
        dkg_published_at = ?
    WHERE report_id = ?
  `);

  // Extract asset ID from UAL (last part after the last /)
  const assetId = CONFIG.dkg_ual.split('/').pop();

  updateStmt.run(
    CONFIG.dkg_ual,
    assetId,
    new Date().toISOString(),
    reportId
  );

  console.log(`✅ DKG information updated`);
  console.log(`   UAL: ${CONFIG.dkg_ual}`);
  console.log(`   Asset ID: ${assetId}`);

  // Step 3: Verify the created report
  console.log('\n📋 Step 3: Verifying created report...');

  const verifyStmt = db.prepare(`
    SELECT
      report_id, referendum_index, report_name, is_premium,
      premium_price_trac, payee_wallet, report_ual, dkg_asset_id,
      author_type, data_size_bytes, dkg_published_at
    FROM reports
    WHERE report_id = ?
  `);

  const report = verifyStmt.get(reportId);

  console.log('\n✅ Report Created Successfully!');
  console.log('═══════════════════════════════════════════════');
  console.log(`Report ID: ${report.report_id}`);
  console.log(`Proposal Index: ${report.referendum_index}`);
  console.log(`Report Name: ${report.report_name}`);
  console.log(`Premium: ${report.is_premium ? 'Yes' : 'No'}`);
  console.log(`Price: $${report.premium_price_trac} USDC`);
  console.log(`Payee Wallet: ${report.payee_wallet}`);
  console.log(`Author Type: ${report.author_type}`);
  console.log(`Data Size: ${report.data_size_bytes} bytes`);
  console.log(`DKG UAL: ${report.report_ual}`);
  console.log(`DKG Asset ID: ${report.dkg_asset_id}`);
  console.log(`Published At: ${report.dkg_published_at}`);
  console.log('═══════════════════════════════════════════════');

  // Step 4: Show API access information
  console.log('\n🔐 API Access Information:');
  console.log(`\nTo request access to this premium report:`);
  console.log(`POST http://localhost:3001/api/premium-reports/${reportId}/request-access`);
  console.log(`Body: { "wallet": "<user_wallet_address>" }`);
  console.log(`\nThe X402 middleware will require a payment of $${report.premium_price_trac} USDC`);
  console.log(`Payment will be sent to: ${report.payee_wallet}`);

} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error);
} finally {
  db.close();
  console.log('\n🔒 Database connection closed');
}
