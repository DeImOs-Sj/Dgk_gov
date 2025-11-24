/**
 * Polkadot Governance DKG Integration - Backend Server
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './database/db.js';
import proposalsRouter from './routes/proposals.js';
import reportsRouter from './routes/reports.js';
import premiumReportsRouter from './routes/premium-reports.js';
import { createDynamicX402Middleware, createDynamicX402MiddlewareForGet, FACILITATOR_URL } from './middleware/x402-config.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Initialize database
try {
  initializeDatabase();
  console.log('✅ Database initialized');
} catch (error) {
  console.error('❌ Database initialization failed:', error);
  process.exit(1);
}

// X402 Payment Middleware - Apply before routes
// This dynamically handles payments for premium report access
app.use(createDynamicX402MiddlewareForGet()); // For GET /api/premium-reports/:id
app.use(createDynamicX402Middleware());       // For POST /api/premium-reports/:id/request-access

console.log('🔐 X402 Payment middleware configured');
console.log(`   Facilitator: ${FACILITATOR_URL}`);
console.log(`   Network: base-sepolia`);
console.log(`   GET  /api/premium-reports/:id - Single request flow`);
console.log(`   POST /api/premium-reports/:id/request-access - Legacy flow`);

// Routes
app.get('/', (req, res) => {
  res.json({
    name: 'Polkadot Governance DKG Integration API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      proposals: '/api/proposals',
      reports: '/api/reports',
      premiumReports: '/api/premium-reports',
      health: '/health'
    }
  });
});



app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: 'connected',
    dkg_api: process.env.DKG_PUBLISHER_API_URL
  });
});

// API Routes
app.use('/api/proposals', proposalsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/premium-reports', premiumReportsRouter);

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Polkadot Governance DKG Integration - Backend Server');
  console.log('='.repeat(60));
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`🔗 DKG Publisher API: ${process.env.DKG_PUBLISHER_API_URL}`);
  console.log(`💾 Database: ${process.env.DATABASE_PATH}`);
  console.log('='.repeat(60));
  console.log('\n📋 Available endpoints:');
  console.log('   GET  /                           - API info');
  console.log('   GET  /health                     - Health check');
  console.log('   GET  /api/proposals              - List all proposals');
  console.log('   GET  /api/proposals/:index       - Get proposal details');
  console.log('   POST /api/proposals/:index/publish - Publish to DKG');
  console.log('   GET  /api/proposals/:index/jsonld  - Get JSON-LD');
  console.log('   GET  /api/reports                - List all reports');
  console.log('   GET  /api/reports/proposal/:index - Get reports for proposal');
  console.log('   POST /api/reports/submit         - Submit new report');
  console.log('   POST /api/reports/:id/verify     - Verify report with AI');
  console.log('   POST /api/reports/:id/publish    - Publish report to DKG');
  console.log('\n   🔐 X402 Premium Reports:');
  console.log('   GET  /api/premium-reports/auth-message/:wallet - Generate auth message');
  console.log('   GET  /api/premium-reports/proposal/:index      - Get premium reports');
  console.log('   GET  /api/premium-reports/:id                  - Get specific report (X402)');
  console.log('   POST /api/premium-reports/submit               - Submit premium report');
  console.log('   POST /api/premium-reports/:id/publish          - Publish to DKG');
  console.log('   POST /api/premium-reports/:id/request-access   - Request access (payment)');
  console.log('   GET  /api/premium-reports/:id/payment-message  - Get payment message');
  console.log('   GET  /api/premium-reports/user/my-access       - Get my access records');
  console.log('   GET  /api/premium-reports/ual/:ual/linked-reports - Get reports by UAL');
  console.log('='.repeat(60) + '\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

export default app;
