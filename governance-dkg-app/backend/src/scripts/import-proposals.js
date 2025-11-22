/**
 * Import Proposals from CSV
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { parseReferendumsCSV } from '../utils/csv-parser.js';
import { proposalQueries, initializeDatabase } from '../database/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_PATH = process.env.CSV_PATH || path.join(__dirname, '../../../../resources/all_referendums.csv');

console.log('🚀 Importing proposals from CSV...\n');

try {
  // Initialize database
  initializeDatabase();

  // Parse CSV
  const proposals = parseReferendumsCSV(CSV_PATH);

  console.log(`\n📊 Importing ${proposals.length} proposals...`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const proposal of proposals) {
    try {
      // Check if already exists
      const existing = proposalQueries.getByIndex(proposal.referendum_index);
      if (existing) {
        skipped++;
        continue;
      }

      // Insert proposal
      proposalQueries.insert(proposal);
      imported++;

      if (imported % 100 === 0) {
        console.log(`   📦 Imported ${imported} proposals...`);
      }
    } catch (error) {
      errors++;
      console.error(`   ❌ Error importing referendum #${proposal.referendum_index}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 IMPORT SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Imported: ${imported}`);
  console.log(`⏭️  Skipped (already exists): ${skipped}`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`📋 Total: ${proposals.length}`);
  console.log('='.repeat(60));

  // Now add the known UALs for referendum #5
  console.log('\n🔗 Adding known UALs for Referendum #5...');

  try {
    proposalQueries.updateDKGStatus(
      5,
      'did:dkg:otp:20430/0xcdb28e93ed340ec10a71bba00a31dbfcf1bd5d37/396116',
      '396116',
      null,
      'published',
      'https://dkg.origintrail.io/explore?ual=did:dkg:otp:20430/0xcdb28e93ed340ec10a71bba00a31dbfcf1bd5d37/396116'
    );
    console.log('   ✅ Main UAL added for Referendum #5');
  } catch (error) {
    console.error('   ❌ Error adding UAL:', error.message);
  }

  console.log('\n✅ Import complete!\n');

} catch (error) {
  console.error('❌ Import failed:', error);
  process.exit(1);
}
