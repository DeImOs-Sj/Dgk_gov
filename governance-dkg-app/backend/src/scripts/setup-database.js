/**
 * Database Setup Script
 */
import { initializeDatabase } from '../database/db.js';

console.log('🚀 Setting up database...\n');

try {
  initializeDatabase();
  console.log('\n✅ Database setup complete!');
} catch (error) {
  console.error('❌ Database setup failed:', error);
  process.exit(1);
}
