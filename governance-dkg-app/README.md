# Polkadot Governance DKG Integration

A web application that publishes Polkadot governance proposals as DKG Knowledge Assets and enables community members to submit verified reports through a tokenized submission system.

## Features

- 📋 **Proposal Management**: View all 1700+ Polkadot OpenGov proposals
- 🔗 **DKG Integration**: Publish proposals as Knowledge Assets on OriginTrail DKG
- 📝 **Report Submission**: Community members can submit verified reports
- 🤖 **AI Verification**: Automatic verification using OpenAI GPT-4
- 💰 **Payment Calculation**: Dynamic fee based on report size
- 🔍 **DKG Explorer Links**: Direct links to view assets on DKG

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                     │
│  - Proposal List                                         │
│  - Proposal Detail                                       │
│  - Report Submission Form                                │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  Backend (Express API)                   │
│  - Proposals API                                         │
│  - Reports API                                           │
│  - AI Verification Service                               │
│  - DKG Service                                           │
└─────────────────────────────────────────────────────────┘
           │                          │
           ▼                          ▼
┌──────────────────┐      ┌──────────────────────────────┐
│  SQLite Database │      │   DKG Publisher API          │
│  - Proposals     │      │   (http://localhost:9200)    │
│  - Reports       │      │   → DKG Node                 │
└──────────────────┘      │   → OriginTrail Blockchain   │
                          └──────────────────────────────┘
```

## Prerequisites

1. **DKG Node Setup** (already configured in `/home/ssd/ot_hack/my_dkg_node`)
   - DKG Publisher API running on `http://localhost:9200`
   - Wallet with NEURO tokens for publishing

2. **Node.js** (v18 or higher)

3. **OpenAI API Key** (already configured in DKG node)

## Quick Start

### 1. Install Dependencies

```bash
cd /home/ssd/ot_hack/governance-dkg-app

# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Setup Database

```bash
cd backend
npm run setup-db
```

### 3. Import Proposals from CSV

```bash
npm run import-proposals
```

This will:
- Import all 1700+ proposals from `resources/all_referendums.csv`
- Add the known UAL for Referendum #5

### 4. Start the Application

#### Option A: Start Everything (Recommended)

```bash
# From the root directory
cd /home/ssd/ot_hack/governance-dkg-app
npm run dev
```

This starts:
- Backend API on `http://localhost:3001`
- Frontend on `http://localhost:3000`

#### Option B: Start Separately

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### 5. Access the Application

Open your browser to: **http://localhost:3000**

## API Endpoints

### Proposals

- `GET /api/proposals` - List all proposals
- `GET /api/proposals/:index` - Get proposal details
- `POST /api/proposals/:index/publish` - Publish proposal to DKG
- `GET /api/proposals/:index/jsonld` - Get JSON-LD representation

### Reports

- `GET /api/reports` - List all reports
- `GET /api/reports/proposal/:index` - Get reports for a proposal
- `POST /api/reports/submit` - Submit a new report
- `POST /api/reports/:id/verify` - Verify report with AI
- `POST /api/reports/:id/publish` - Publish verified report to DKG

## Usage Flow

### Publishing a Proposal

1. Navigate to a proposal detail page
2. Click "Publish to DKG"
3. Wait for the DKG publishing process
4. UAL will be displayed once published

### Submitting a Report

1. Navigate to a proposal with a UAL (currently only Referendum #5)
2. Enter your wallet address
3. Enter JSON-LD report data (or click "Load Example")
4. Click "Submit for Verification"
5. AI will automatically verify the report
6. If verified (confidence > 0.7), it will be published to DKG
7. UAL will be displayed for the published report

### Example Report JSON-LD

```json
{
  "@context": {
    "schema": "https://schema.org/",
    "polkadot": "https://polkadot.network/governance/"
  },
  "@type": "schema:Report",
  "@id": "polkadot:referendum:5:report:1",
  "schema:name": "Q1 Progress Report",
  "schema:description": "Implementation progress for Q1 2025",
  "schema:about": "polkadot:referendum:5",
  "polkadot:milestones": [
    {
      "@type": "schema:Action",
      "schema:name": "DIP Integration",
      "schema:status": "Completed"
    }
  ],
  "schema:dateCreated": "2025-03-15T00:00:00Z"
}
```

## Configuration

### Backend Environment Variables

Edit `backend/.env`:

```env
PORT=3001
DATABASE_PATH=../database/governance.db
DKG_PUBLISHER_API_URL=http://localhost:9200
DKG_BLOCKCHAIN=otp:20430
DKG_EXPLORER_BASE=https://dkg.origintrail.io
OPENAI_API_KEY=your_key_here
BASE_FEE_TRAC=0.05
PER_KB_FEE_TRAC=0.01
AI_VERIFICATION_THRESHOLD=0.7
```

## Project Structure

```
governance-dkg-app/
├── backend/
│   ├── src/
│   │   ├── database/
│   │   │   ├── schema.js       # Database schema
│   │   │   └── db.js           # Database operations
│   │   ├── routes/
│   │   │   ├── proposals.js    # Proposals API
│   │   │   └── reports.js      # Reports API
│   │   ├── services/
│   │   │   ├── dkg-service.js  # DKG integration
│   │   │   └── ai-verification-service.js
│   │   ├── utils/
│   │   │   ├── csv-parser.js
│   │   │   └── jsonld-generator.js
│   │   ├── scripts/
│   │   │   ├── setup-database.js
│   │   │   └── import-proposals.js
│   │   └── index.js            # Main server
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ProposalList.jsx
│   │   │   └── ProposalDetail.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   └── package.json
├── database/
│   └── governance.db           # SQLite database (created on setup)
└── package.json
```

## Known UALs

Currently, only Referendum #5 has a published UAL:

- **Main UAL**: `did:dkg:otp:20430/0xcdb28e93ed340ec10a71bba00a31dbfcf1bd5d37/396116`
- **Public UAL**: `did:dkg:otp:20430/0xcdb28e93ed340ec10a71bba00a31dbfcf1bd5d37/396140`
- **Private UAL**: `did:dkg:otp:20430/0xcdb28e93ed340ec10a71bba00a31dbfcf1bd5d37/396125`

Reports can only be submitted for proposals with UALs.

## Troubleshooting

### DKG Publisher API Not Available

Make sure the DKG node is running:

```bash
cd /home/ssd/ot_hack/my_dkg_node/dkg-node/apps/agent
npm run dev:server
```

### Database Locked Error

Stop all backend instances and restart:

```bash
pkill -f "node.*backend"
cd backend && npm run dev
```

### OpenAI API Errors

Check that the API key in `backend/.env` is valid and has credits.

## Future Enhancements

- On-chain payment verification
- Automatic reward distribution
- IPFS integration for large reports
- Reputation system for reporters
- SPARQL queries across proposal graph
- Paranet deployment
- Batch publishing of all proposals

## License

MIT

## Credits

Built for OriginTrail DKG Hackathon 2025
