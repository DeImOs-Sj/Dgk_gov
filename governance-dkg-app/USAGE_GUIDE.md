# Polkadot Governance DKG - Usage Guide

## Quick Start

### Option 1: Using the Start Script (Recommended)

```bash
cd /home/ssd/ot_hack/governance-dkg-app
./start.sh
```

This will:
1. Check if the database exists (creates it if not)
2. Start both backend and frontend servers
3. Open the app at http://localhost:3000

### Option 2: Manual Setup

```bash
cd /home/ssd/ot_hack/governance-dkg-app

# 1. Install dependencies
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..

# 2. Setup database (first time only)
cd backend
npm run setup-db
npm run import-proposals
cd ..

# 3. Start servers
npm run dev
```

## Using the Application

### 1. Viewing Proposals

1. Open http://localhost:3000 in your browser
2. You'll see the proposal list page with statistics:
   - Total Proposals: 1767
   - Published to DKG: 1 (Referendum #5)
   - Executed: ~XXX
   - Rejected: ~XXX

3. Browse through all proposals
4. Each proposal shows:
   - Referendum Index
   - Title
   - Status badge (Executed/Rejected/etc.)
   - DKG Published badge (if applicable)
   - Summary
   - UAL (if published)

### 2. Viewing Proposal Details

1. Click on any proposal to see full details
2. You'll see:
   - Full proposal information
   - Summary
   - Proposer address
   - Treasury proposal ID
   - UAL and DKG Explorer link (if published)

### 3. Publishing a Proposal to DKG

**For proposals without a UAL:**

1. Navigate to the proposal detail page
2. Click "Publish to DKG" button
3. Wait for the publishing process (may take 10-30 seconds)
4. Once complete, the UAL will appear
5. Click "View on DKG Explorer" to see the asset on the DKG

**Example API Call:**
```bash
curl -X POST http://localhost:3001/api/proposals/10/publish
```

### 4. Submitting a Report

**Prerequisites:**
- Proposal must have a UAL (currently only Referendum #5)

**Steps:**

1. Navigate to Referendum #5 detail page
2. Scroll to "Submit Additional Report" section
3. Fill in the form:
   - **Your Wallet Address**: Enter your Polkadot wallet address (e.g., `0x1234...`)
   - **Report JSON-LD**: Enter your report in JSON-LD format

4. **Option A: Load Example Report**
   - Click "Load Example" button
   - This will pre-fill a valid JSON-LD report template
   - Modify as needed

5. **Option B: Write Your Own Report**

Example Report JSON-LD:

```json
{
  "@context": {
    "schema": "https://schema.org/",
    "polkadot": "https://polkadot.network/governance/"
  },
  "@type": "schema:Report",
  "@id": "polkadot:referendum:5:report:custom-1",
  "schema:name": "Q1 2025 Progress Report",
  "schema:description": "This report provides an implementation progress update for the KILT DIP project in Q1 2025.",
  "schema:about": "polkadot:referendum:5",
  "polkadot:milestones": [
    {
      "@type": "schema:Action",
      "schema:name": "DIP Pallet Development",
      "schema:status": "Completed",
      "schema:description": "Core DIP pallet implemented and tested"
    },
    {
      "@type": "schema:Action",
      "schema:name": "Cross-chain Integration",
      "schema:status": "In Progress",
      "schema:description": "XCM v3 integration ongoing"
    }
  ],
  "polkadot:technicalMetrics": {
    "codeCoverage": "85%",
    "testsRun": 1250,
    "parachainsIntegrated": 3
  },
  "schema:dateCreated": "2025-03-15T00:00:00Z"
}
```

6. Review the payment information:
   - Size in KB
   - Required payment in TRAC
   - (Currently simulated - no actual payment needed)

7. Click "Submit for Verification"

8. **Automatic Processing:**
   - ✅ Report is submitted to the database
   - 🤖 AI verification is triggered automatically
   - 🔍 OpenAI GPT-4 analyzes the report for:
     - Valid JSON-LD format
     - Reference to correct proposal
     - Reasonable and verifiable claims
     - No spam or malicious content
   - ✅ If verified (confidence > 0.7):
     - Report is automatically published to DKG
     - UAL is generated and displayed
   - ❌ If rejected:
     - Error message with reason is shown

9. **View Published Report:**
   - Once published, the report appears in "Existing Reports" section
   - Click "View on DKG Explorer" to see on the DKG

### 5. Viewing Existing Reports

1. Navigate to any proposal with reports
2. Scroll to "Existing Reports" section
3. Each report shows:
   - Report name
   - Verification status badge
   - Submitter wallet (truncated)
   - Submission date
   - UAL (if published)
   - Link to DKG Explorer

## API Reference

### Proposals API

#### List All Proposals
```bash
GET /api/proposals

curl http://localhost:3001/api/proposals
```

**Response:**
```json
{
  "success": true,
  "count": 1767,
  "data": [...]
}
```

#### Get Proposal Details
```bash
GET /api/proposals/:index

curl http://localhost:3001/api/proposals/5
```

#### Publish Proposal to DKG
```bash
POST /api/proposals/:index/publish

curl -X POST http://localhost:3001/api/proposals/5/publish
```

**Response:**
```json
{
  "success": true,
  "message": "Proposal published to DKG",
  "dkg": {
    "id": "asset-123",
    "status": "pending",
    "ual": "did:dkg:otp:20430/0x.../123456",
    "explorer_url": "https://dkg.origintrail.io/explore?ual=..."
  }
}
```

#### Get JSON-LD Representation
```bash
GET /api/proposals/:index/jsonld

curl http://localhost:3001/api/proposals/5/jsonld
```

### Reports API

#### List All Reports
```bash
GET /api/reports

curl http://localhost:3001/api/reports
```

#### Get Reports for Proposal
```bash
GET /api/reports/proposal/:index

curl http://localhost:3001/api/reports/proposal/5
```

#### Submit Report
```bash
POST /api/reports/submit

curl -X POST http://localhost:3001/api/reports/submit \
  -H "Content-Type: application/json" \
  -d '{
    "referendum_index": 5,
    "submitter_wallet": "0x1234...",
    "report_jsonld": {...}
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Report submitted successfully",
  "report": {
    "report_id": 1,
    "referendum_index": 5,
    "submitter_wallet": "0x1234...",
    "report_name": "Q1 Progress Report",
    "data_size_kb": "1.25",
    "required_payment_trac": 0.0625,
    "payment_address": "0x...",
    "verification_status": "pending"
  }
}
```

#### Verify Report
```bash
POST /api/reports/:id/verify

curl -X POST http://localhost:3001/api/reports/1/verify
```

**Response:**
```json
{
  "success": true,
  "verification": {
    "status": "verified",
    "valid": true,
    "confidence": 0.95,
    "reasoning": "Report is well-structured, references the correct proposal, and provides meaningful progress updates.",
    "issues": []
  }
}
```

#### Publish Report to DKG
```bash
POST /api/reports/:id/publish

curl -X POST http://localhost:3001/api/reports/1/publish
```

## Advanced Features

### Payment Calculation

The system calculates payment based on report size:

```
Base Fee: 0.05 TRAC
Per KB Fee: 0.01 TRAC
Total = max(0.05, 0.05 + (size_kb * 0.01))
```

Examples:
- 500 bytes (0.5 KB): 0.05 TRAC (base fee)
- 2 KB: 0.07 TRAC
- 10 KB: 0.15 TRAC

### AI Verification Criteria

The AI verifies reports based on:

1. **Format Validation** (Required)
   - Valid JSON-LD with @context, @type, @id
   - Proper schema.org vocabulary usage

2. **Contextual Relevance** (Confidence > 0.7)
   - References correct proposal
   - Claims are reasonable given proposal context
   - Provides meaningful additional information

3. **Content Quality** (Confidence > 0.7)
   - No spam or malicious content
   - Verifiable claims
   - Professional tone

4. **Linkage** (Optional but recommended)
   - References parent proposal UAL
   - Includes structured data (milestones, metrics, etc.)

### JSON-LD Best Practices

**Required Fields:**
```json
{
  "@context": {...},     // Namespace definitions
  "@type": "...",        // Entity type
  "@id": "...",          // Unique identifier
  "schema:name": "...",  // Report name
  "schema:about": "..."  // Reference to proposal
}
```

**Recommended Fields:**
```json
{
  "schema:description": "...",     // Detailed description
  "schema:dateCreated": "...",     // ISO 8601 timestamp
  "schema:author": {...},          // Author information
  "polkadot:milestones": [...],    // Progress milestones
  "polkadot:metrics": {...}        // Quantitative metrics
}
```

## Troubleshooting

### Backend Not Starting

```bash
# Check if port 3001 is in use
lsof -i :3001

# Kill any process using the port
kill -9 <PID>

# Restart
cd backend && npm run dev
```

### Database Errors

```bash
# Recreate database
rm database/governance.db
cd backend
npm run setup-db
npm run import-proposals
```

### DKG Publisher API Not Available

Make sure the DKG Publisher API is running:

```bash
cd /home/ssd/ot_hack/my_dkg_node/dkg-node/apps/agent
npm run dev:server
```

Check it's accessible:
```bash
curl http://localhost:9200/api/dkg/assets
```

### OpenAI API Errors

1. Check API key in `backend/.env`
2. Verify you have API credits
3. Check rate limits

### Frontend Not Loading

```bash
# Clear cache and rebuild
cd frontend
rm -rf node_modules dist .vite
npm install
npm run dev
```

## Development Tips

### Testing Different Reports

Try submitting various types of reports to test AI verification:

**Valid Report (should pass):**
- Well-structured JSON-LD
- References proposal correctly
- Contains meaningful progress data

**Invalid Report (should fail):**
- Missing required fields
- References wrong proposal
- Contains spam or nonsense

### Monitoring DKG Publishing

Watch the backend logs to see DKG publishing in real-time:

```bash
cd backend
npm run dev
```

Look for messages like:
```
📤 Publishing to DKG: ...
✅ DKG publish response: ...
```

### Database Queries

Inspect the database directly:

```bash
sqlite3 database/governance.db

# List all proposals with UALs
SELECT referendum_index, title, ual FROM proposals WHERE ual IS NOT NULL;

# Count reports by status
SELECT verification_status, COUNT(*) FROM reports GROUP BY verification_status;

# View all reports for a proposal
SELECT * FROM reports WHERE referendum_index = 5;
```

## Next Steps

1. **Publish More Proposals**: Use the API to publish additional proposals to DKG
2. **Submit Multiple Reports**: Test the full workflow with various report types
3. **Explore DKG**: Click the explorer links to see how data is represented on the DKG
4. **Customize**: Modify the JSON-LD schemas to include custom fields
5. **Integration**: Connect with other DKG tools and services

## Support

For issues or questions:
1. Check the logs in terminal
2. Verify DKG node is running
3. Ensure OpenAI API key is valid
4. Review the README.md for setup instructions
