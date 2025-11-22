# Deployment Checklist

## ✅ Completed Setup

### Backend
- [x] Express server configured (Port 3001)
- [x] SQLite database created (4.2 MB)
- [x] 1,767 proposals imported from CSV
- [x] Referendum #5 has UAL pre-configured
- [x] All API endpoints functional
- [x] DKG service integration ready
- [x] AI verification service configured
- [x] Error handling implemented

### Frontend
- [x] React app structure created
- [x] Vite build configuration
- [x] Component structure complete
- [x] Routing configured
- [x] Styling implemented
- [x] API integration ready

### Database
- [x] Schema created with all tables
- [x] Indexes added for performance
- [x] Proposals table: 1,767 records
- [x] Reports table: Ready for submissions
- [x] UAL tracking configured

### Documentation
- [x] README.md - Setup instructions
- [x] USAGE_GUIDE.md - Detailed usage
- [x] PROJECT_SUMMARY.md - Architecture overview
- [x] This deployment checklist

## 🚀 Quick Start Commands

### Start Everything

```bash
cd /home/ssd/ot_hack/governance-dkg-app
./start.sh
```

Or manually:

```bash
# Terminal 1: Backend
cd /home/ssd/ot_hack/governance-dkg-app/backend
npm run dev

# Terminal 2: Frontend
cd /home/ssd/ot_hack/governance-dkg-app/frontend
npm run dev
```

### Verify Services

```bash
# Backend health check
curl http://localhost:3001/health

# Proposals API
curl http://localhost:3001/api/proposals

# Referendum #5 (with UAL)
curl http://localhost:3001/api/proposals/5
```

## 📋 Testing Workflow

### 1. View Proposals
1. Open http://localhost:3000
2. Verify you see 1,767 proposals
3. Stats should show: 1 Published to DKG
4. Click on Referendum #5

### 2. Test Proposal Detail
1. View Referendum #5 details
2. Verify UAL is displayed:
   ```
   did:dkg:otp:20430/0xcdb28e93ed340ec10a71bba00a31dbfcf1bd5d37/396116
   ```
3. Click "View on DKG Explorer" (opens in new tab)
4. Verify "Submit Additional Report" section is visible

### 3. Submit a Report
1. Enter wallet address: `0x1234567890abcdef1234567890abcdef12345678`
2. Click "Load Example" button
3. Review the pre-filled JSON-LD
4. Click "Submit for Verification"
5. Wait for AI verification (2-5 seconds)
6. If verified: UAL will be displayed
7. If rejected: Error message with reason

### 4. Publish a New Proposal
1. Navigate to any proposal without a UAL (e.g., Referendum #10)
2. Click "Publish to DKG" button
3. **Note**: This requires the DKG Publisher API to be running
4. Wait for publishing (10-30 seconds)
5. UAL will be displayed when complete

## 🔧 Required Services

### 1. DKG Publisher API (Port 9200)

**Check if running:**
```bash
curl http://localhost:9200/api/dkg/assets
```

**Start if needed:**
```bash
cd /home/ssd/ot_hack/my_dkg_node/dkg-node/apps/agent
npm run dev:server
```

### 2. Backend API (Port 3001)

**Check if running:**
```bash
curl http://localhost:3001/health
```

**Start if needed:**
```bash
cd /home/ssd/ot_hack/governance-dkg-app/backend
npm run dev
```

### 3. Frontend (Port 3000)

**Check if running:**
```bash
curl http://localhost:3000
```

**Start if needed:**
```bash
cd /home/ssd/ot_hack/governance-dkg-app/frontend
npm run dev
```

## ⚙️ Environment Variables

### Backend (.env)
```env
PORT=3001
DATABASE_PATH=../database/governance.db
DKG_PUBLISHER_API_URL=http://localhost:9200
DKG_BLOCKCHAIN=otp:20430
DKG_EXPLORER_BASE=https://dkg.origintrail.io
OPENAI_API_KEY=sk-proj-... (configured)
BASE_FEE_TRAC=0.05
PER_KB_FEE_TRAC=0.01
AI_VERIFICATION_THRESHOLD=0.7
```

## 📊 Database Statistics

- **File**: `database/governance.db` (4.2 MB)
- **Proposals**: 1,767 records
- **With UAL**: 1 (Referendum #5)
- **Reports**: 0 (ready for submissions)
- **Schema**: 2 tables, 6 indexes

## 🧪 API Testing

### Test All Endpoints

```bash
# Health check
curl http://localhost:3001/health

# List proposals
curl http://localhost:3001/api/proposals | jq '.count'

# Get Referendum #5
curl http://localhost:3001/api/proposals/5 | jq '.data.ual'

# Get JSON-LD for Referendum #5
curl http://localhost:3001/api/proposals/5/jsonld | jq

# List all reports
curl http://localhost:3001/api/reports

# Get reports for Referendum #5
curl http://localhost:3001/api/reports/proposal/5
```

### Submit Test Report

```bash
curl -X POST http://localhost:3001/api/reports/submit \
  -H "Content-Type: application/json" \
  -d '{
    "referendum_index": 5,
    "submitter_wallet": "0x1234567890abcdef1234567890abcdef12345678",
    "report_jsonld": {
      "@context": {
        "schema": "https://schema.org/",
        "polkadot": "https://polkadot.network/governance/"
      },
      "@type": "schema:Report",
      "@id": "polkadot:referendum:5:report:test-1",
      "schema:name": "Test Progress Report",
      "schema:description": "Testing the report submission system",
      "schema:about": "polkadot:referendum:5"
    }
  }'
```

## 🐛 Troubleshooting

### Backend Won't Start

**Check port:**
```bash
lsof -i :3001
# If occupied, kill process or change PORT in .env
```

**Check logs:**
```bash
cd backend && npm run dev
# Look for errors in console
```

### Frontend Won't Start

**Clear cache:**
```bash
cd frontend
rm -rf node_modules .vite dist
npm install
npm run dev
```

### Database Errors

**Recreate database:**
```bash
rm database/governance.db*
cd backend
npm run setup-db
npm run import-proposals
```

### DKG Publishing Fails

**Verify DKG Publisher API:**
```bash
curl http://localhost:9200/api/dkg/assets
```

**Check DKG node:**
```bash
cd /home/ssd/ot_hack/my_dkg_node/dkg-node/apps/agent
npm run dev:server
```

### AI Verification Fails

**Check OpenAI API key:**
```bash
# Verify in backend/.env
grep OPENAI_API_KEY backend/.env
```

**Test manually:**
```bash
curl -X POST http://localhost:3001/api/reports/1/verify
# Replace 1 with actual report_id
```

## 📦 Deliverables

### Code
- [x] Full-stack application (React + Express)
- [x] Database with schema and data
- [x] API endpoints (10 routes)
- [x] DKG integration
- [x] AI verification service

### Data
- [x] 1,767 proposals imported
- [x] 1 proposal with UAL (Referendum #5)
- [x] JSON-LD conversion working
- [x] UAL tracking implemented

### Documentation
- [x] Setup guide (README.md)
- [x] Usage guide (USAGE_GUIDE.md)
- [x] Architecture overview (PROJECT_SUMMARY.md)
- [x] Deployment checklist (this file)
- [x] Inline code comments

### Features
- [x] Browse all proposals
- [x] View proposal details
- [x] Publish to DKG
- [x] Submit reports
- [x] AI verification
- [x] Auto-publish verified reports
- [x] DKG Explorer links
- [x] Copy UAL to clipboard

## ✨ Demo Scenarios

### Scenario 1: Browse Governance Data
1. Open http://localhost:3000
2. See 1,767 proposals with statistics
3. Click on different proposals
4. Notice which ones have UALs (currently only #5)

### Scenario 2: Submit a Valid Report
1. Navigate to Referendum #5
2. Enter wallet: `0xABCDEF1234567890ABCDEF1234567890ABCDEF12`
3. Click "Load Example"
4. Modify report name to: "Implementation Milestone Q1 2025"
5. Click "Submit for Verification"
6. Watch AI verification succeed
7. See UAL generated
8. Click "View on DKG Explorer"

### Scenario 3: Publish New Proposal
1. Navigate to Referendum #10
2. Click "Publish to DKG"
3. Wait for DKG publishing
4. See UAL appear
5. Verify it's now marked as "DKG Published"

### Scenario 4: Submit Invalid Report
1. Navigate to Referendum #5
2. Enter wallet: `invalid-wallet`
3. Enter invalid JSON in report field
4. Click "Submit for Verification"
5. See validation error
6. Fix the JSON and try again

## 🎯 Success Criteria

- [x] All 1,767 proposals visible in UI
- [x] Referendum #5 has working UAL
- [x] Reports can be submitted
- [x] AI verification works
- [x] DKG publishing succeeds (when API available)
- [x] All documentation complete
- [x] No critical bugs

## 📝 Notes

### Payment System
- Currently **simulated** (no actual blockchain transactions)
- Calculates correct TRAC amount
- Ready for on-chain integration

### DKG Publishing
- Requires DKG Publisher API on port 9200
- May take 10-30 seconds per asset
- UAL is returned upon successful publish
- Transaction hashes not yet tracked (can be added)

### AI Verification
- Uses OpenAI GPT-4-mini (fast and cost-effective)
- Confidence threshold: 0.7 (70%)
- Can be adjusted in backend/.env
- Provides detailed reasoning

### Production Readiness
For production deployment, consider:
- [ ] PostgreSQL instead of SQLite
- [ ] Redis for caching
- [ ] Rate limiting
- [ ] User authentication
- [ ] HTTPS/SSL
- [ ] Environment-specific configs
- [ ] Monitoring & logging
- [ ] Backup strategies

## 🚀 Ready to Launch!

The system is fully functional and ready for demonstration. Start with:

```bash
cd /home/ssd/ot_hack/governance-dkg-app
./start.sh
```

Then open http://localhost:3000 and start exploring!

---

**Status**: ✅ All systems operational
**Last Updated**: 2025-11-19
**Version**: 1.0.0
