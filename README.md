# Polkadot Governance DKG (DotGraph)

**Track:** Challenge 4: Wild Card
**Hackathon:** [OriginTrail Scaling Trust AI](https://dorahacks.io/hackathon/origintrail-scaling-trust-ai/tracks)
**Demo Video:** [Watch on YouTube](https://youtu.be/aU8KbD7J6bc)

A decentralized transparency engine for Polkadot OpenGov that leverages the OriginTrail Decentralized Knowledge Graph (DKG) to create a verifiable, immutable history of proposal milestones, reporter reputation, and governance updates. This full-stack application combines AI-driven verification, DKG semantic linking, and automated smart contract incentives to address accountability in the $100M+ annual Polkadot Treasury spend.

## 📋 Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Port Configuration](#port-configuration)
- [Impact & Use Cases](#impact--use-cases)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

DotGraph transforms Polkadot OpenGov into a transparent, accountable system by creating a permanent, queryable knowledge graph of proposal histories and community reports. Unlike traditional systems that rely on centralized databases or fragmented social media posts, DotGraph leverages the OriginTrail DKG to ensure data integrity and discoverability.

### Components

1. **DKG Node** - OriginTrail edge node for decentralized knowledge graph storage
2. **Governance Backend** - Express.js API for proposal management and DKG integration
3. **Governance Frontend** - React UI for browsing proposals and submitting reports

### Key Features

- 📊 **Browse & Track** - Access all 1,700+ Polkadot OpenGov proposals in one interface
- 🤖 **AI Verification** - Automated validation of reports using LLMs to prevent spam
- 📝 **Submit Reports** - Community members can attach verified, immutable reports to proposals
- 🔗 **DKG Publishing** - Reports published as JSON-LD knowledge assets with semantic linking
- 💰 **Stake-to-Reward** - Automated smart contract rewards for verified reporters
- 🔍 **Semantic Discovery** - Query relationships between proposals, authors, and outcomes
- 💎 **Monetized Access** - x402 protocol enables reporters to monetize premium audit content

## 🚨 Problem Statement

Polkadot OpenGov allocates nearly **$100 million annually** for proposals and bounties. Despite this scale, the ecosystem suffers from critical transparency issues:

### Current Challenges

1. **No On-Chain Accountability** - No native mechanism to track milestone updates or historical changes to proposals on-chain

2. **Title Manipulation** - Proposers can alter titles (e.g., changing a failing proposal's title to "Please Vote Nay") to evade negative reputation, with changes lost to history

3. **Fragmented Reporting** - Honest teams publish updates across social media and disparate forums, making it difficult for voters to find milestone reports

4. **Inefficient Tipping System** - Manual tipping for community auditors is slow and tedious, consuming voter time and discouraging consistent reporting due to high friction

## 💡 Solution

DotGraph acts as a **Truth Layer** for OpenGov, providing:

### Automated Accountability
- **Stake-to-Reward Model**: Replaces manual tipping with smart contract automation. Users stake to submit; upon verification and DKG publication, the contract automatically refunds stake + issues rewards from an OpenGov-funded pool

### Semantic Discovery
- **Beyond Keyword Search**: Query relationships between entities (e.g., "Show all rejected proposals by Author X that had title changes")
- **Permanent History**: Creates an uncensorable reputation history that survives UI changes or forum deletions

### Economic Incentives
- **Reporter Monetization**: x402 protocol allows reporters to monetize high-value, private intelligence while keeping metadata public
- **Quality Barriers**: Staking prevents spam while ensuring reporters are compensated for due diligence

## 🏗️ Architecture

This project implements the **three-layer architecture** required by the hackathon:

### Layer 1: Agent Layer (AI Verification & Orchestration)
- **Role**: Verification Agent powered by ChatGPT
- **Function**: Analyzes JSON-LD content against parent proposals to verify legitimacy and context
- **Synergy**: Acts as gatekeeper, ensuring only high-quality, relevant knowledge assets reach the DKG

### Layer 2: Knowledge Layer (OriginTrail DKG)
- **Role**: Connective tissue for governance data
- **Implementation**: DKG Edge Node ingests and publishes reports
- **Data Structure**:
  - **Entities**: Proposals mapped as parent nodes
  - **Assets**: User reports converted to JSON-LD (Linked Data)
  - **Linking**: Automatic URI appending creates permanent graph links between on-chain proposals and external reports
- **Result**: Global, verifiable graph of governance history

### Layer 3: Trust Layer (Incentives & Smart Contracts)
- **Role**: Economic backbone and reputation system
- **Implementation**:
  - **Staking for Quality**: Economic barrier prevents spam submissions
  - **Automated Reward Pool**: Smart contract validates publication and executes refund + reward to signing wallet
  - **Sustainable Funding**: Designed to connect with dedicated OpenGov bounty/pool
  - **x402 Protocol**: Gates premium content for peer-to-peer monetization

### User Flow

1. **Data Ingestion**: App fetches all live Polkadot OpenGov proposals (1,700+)
2. **Report Construction**: User selects proposal, inputs JSON-LD report data, connects wallet
3. **Trust Check**: System calculates staking fee based on data size; user approves transaction
4. **Agent Verification**: Backend AI agent verifies report relates to proposal ID
5. **DKG Publication**: Verified asset published to network and anchored on blockchain (NeuroWeb/Polkadot)
6. **Automated Reward**: Smart contract triggers, sending stake + reward back to user's wallet
7. **Consumption**: Public graph accessible to all; x402 gateway requests micropayment for private content

## 📦 Prerequisites

### System Requirements
- Ubuntu 20.04+ / WSL2
- Node.js v22 (DKG), v16+ (app)
- 8GB RAM minimum
- 20GB storage

### Install Dependencies

```bash
# Node.js via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 22
nvm install 16

# System packages
sudo apt-get update
sudo apt-get install mysql-server redis-server git

# DKG CLI
npm install -g dkg-cli
```

## 🚀 Installation

### 1. Clone & Setup DKG Node

```bash
git clone <your-repo-url>
cd ot_hack

# Generate DKG configuration
dkg-cli setup-config --testnet --neuroweb

# Install DKG node (10-20 minutes)
dkg-cli install

# Setup agent
cd my_dkg_node/dkg-node
dkg-cli agent-setup
dkg-cli create-user
```

### 2. Setup Governance App

```bash
# Backend
cd ~/ot_hack/governance-dkg-app/backend
npm install
node src/scripts/setup-database.js

# Frontend
cd ../frontend
npm install
```

## ⚙️ Configuration

### DKG Node (Dev Mode)

`my_dkg_node/dkg-node/apps/agent/.env.development.local`:
```bash
PORT=9201
EXPO_PUBLIC_MCP_URL="http://localhost:9201"
EXPO_PUBLIC_APP_URL="http://localhost:8081"
```

### Backend

`governance-dkg-app/backend/.env`:
```bash
PORT=3001
DKG_PUBLISHER_API_URL=http://localhost:9201
OPENAI_API_KEY=your_key_here
```

### Frontend

`governance-dkg-app/frontend/.env`:
```bash
VITE_API_URL=http://localhost:3001
```

## 🏃 Running the Application

### Method 1: Automated (Recommended)

```bash
cd ~/ot_hack
./start-dkg-dev.sh
```

Then in separate terminals:
```bash
# Terminal 1: Backend
cd governance-dkg-app/backend && npm run dev

# Terminal 2: Frontend
cd governance-dkg-app/frontend && npm run dev
```

### Method 2: Manual

**Terminal 1: DKG Node**
```bash
cd my_dkg_node/dkg-node
dkg-cli run-dev
```

**Terminal 2: Backend Services**
```bash
# Fix Redis if needed
sudo ~/ot_hack/fix-redis.sh

# Start services
sudo systemctl start dkg-engine blazegraph mysql redis-server
```

**Terminal 3: Backend API**
```bash
cd governance-dkg-app/backend
npm run dev
```

**Terminal 4: Frontend**
```bash
cd governance-dkg-app/frontend
npm run dev
```

### Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **DKG Node UI**: http://localhost:8081
- **MCP Server**: http://localhost:9201

## 🔌 Port Configuration

| Service | Port | Mode | Description |
|---------|------|------|-------------|
| DKG Node UI | 8081 | Dev | Expo interface |
| MCP Server | 9201 | **Dev** | Development mode |
| MCP Server | 9200 | Prod | Systemd service |
| DKG Engine | 8900 | Both | OriginTrail HTTP API |
| Blazegraph | 9999 | Both | Triple store |
| MySQL | 3306 | Both | Database |
| Redis | 6379 | Both | Job queue |
| Backend API | 3001 | Both | Express API |
| Frontend | 5173 | Dev | Vite server |

## 🎯 Impact & Use Cases

### For Polkadot Ecosystem
- **Treasury Protection**: Creates permanent, uncensorable reputation history for proposers, securing the $100M treasury against repeat bad actors
- **Voter Efficiency**: Enables informed decision-making through easy access to historical proposal data and updates
- **AI-Driven Governance**: Enables future autonomous agents to query the DKG and "vote" on proposals based on historical reliability of proposers

### For Community Reporters
- **Monetization Channel**: Provides income opportunities via x402 for governance auditors who currently work for free
- **Automated Rewards**: Eliminates friction of manual tipping process, incentivizing higher-quality due diligence
- **Reputation Building**: Establishes verifiable track record of quality reporting on-chain

### For the Broader Ecosystem
- **Cross-Chain Reputation**: Framework can extend to track reputation across other Parachains
- **Transparency Standard**: Sets precedent for governance transparency in Web3
- **AI Training Data**: Creates structured, verifiable dataset for training governance-focused AI agents

## 🔧 Troubleshooting

### Redis Not Running
**Error**: `ECONNREFUSED 127.0.0.1:6379`

```bash
sudo ./fix-redis.sh
sudo systemctl restart dkg-engine
```

### DKG Engine Not Responding
**Error**: `ECONNREFUSED 127.0.0.1:8900`

DKG Engine requires Redis. Fix Redis first (see above).

### Port 9200 Conflict
```bash
sudo systemctl stop dkg-agent
cd my_dkg_node/dkg-node && dkg-cli run-dev
```

### Check Services
```bash
dkg-cli status
systemctl status redis-server dkg-engine mysql

# Test endpoints
curl http://localhost:8900  # DKG Engine
curl http://localhost:3001  # Backend
curl http://localhost:9201  # MCP Server
```

## 📁 Project Structure

```
ot_hack/
├── my_dkg_node/
│   ├── .env                    # DKG config
│   └── dkg-node/
│       ├── apps/agent/         # MCP server
│       └── dkg-engine/         # OriginTrail node
├── governance-dkg-app/
│   ├── backend/                # Express API
│   ├── frontend/               # React UI
│   └── database/               # SQLite
├── start-dkg-dev.sh           # Startup script
├── fix-redis.sh               # Redis repair
└── README.md                  # This file
```

## 📚 Resources

### Project Links
- **GitHub Repository**: [DeImOs-Sj/Dgk_gov](https://github.com/DeImOs-Sj/Dgk_gov)
- **Demo Video**: [YouTube](https://youtu.be/aU8KbD7J6bc)
- **Hackathon**: [OriginTrail Scaling Trust AI](https://dorahacks.io/hackathon/origintrail-scaling-trust-ai/tracks)

### Documentation
- [OriginTrail Docs](https://docs.origintrail.io)
- [DKG CLI](https://github.com/OriginTrail/dkg-cli)
- [Polkadot Governance](https://polkadot.network/features/governance/)

---
