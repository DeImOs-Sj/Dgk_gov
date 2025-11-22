/**
 * CSV Parser for Polkadot Referendums
 */
import fs from 'fs';
import { parse } from 'csv-parse/sync';

export function parseReferendumsCSV(filePath) {
  console.log('📄 Reading CSV file:', filePath);

  const fileContent = fs.readFileSync(filePath, 'utf-8');

  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  console.log(`✅ Parsed ${records.length} records from CSV`);

  return records.map(record => ({
    referendum_index: parseInt(record.referendum_index),
    title: record.title || 'Untitled Proposal',
    summary: record.Summary || '',
    status: record.status || 'Unknown',
    origin: record.origins || '',
    proposer_address: record.account_address || '',
    beneficiary_address: record.beneficiary_address || '',
    ayes_amount: record.ayes_amount || '0',
    nays_amount: record.nays_amount || '0',
    requested_amount: record.beneficiary_amount || '0',
    treasury_proposal_id: parseInt(record.treasury_proposal_id) || -1,
    created_block: parseInt(record.created_block) || 0,
    latest_block: parseInt(record.latest_block_num) || 0,
    created_at: record.created_at || new Date().toISOString(),
    updated_at: record.updated_at || new Date().toISOString()
  }));
}

export default { parseReferendumsCSV };
