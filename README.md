# Polkadot Governance DKG Integration

A full-stack application integrating OriginTrail Decentralized Knowledge Graph (DKG) with Polkadot governance data, enabling AI-powered analysis and transparent tracking of governance proposals and community reports.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Port Configuration](#port-configuration)
- [Troubleshooting](#troubleshooting)
- [Git & Removed Files](#git--removed-files)

## 🎯 Overview

### Components

1. **DKG Node** - OriginTrail node for decentralized knowledge graph storage
2. **Governance Backend** - Express.js API for proposal management and DKG integration
3. **Governance Frontend** - React UI for browsing proposals and submitting reports

### Features

- 📊 Browse Polkadot governance proposals
- 🤖 AI-powered report verification (OpenAI)
- 📝 Submit community reports
- 🔗 Publish to DKG as verifiable credentials
- 🔍 Query DKG data

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

- [OriginTrail Docs](https://docs.origintrail.io)
- [DKG CLI](https://github.com/OriginTrail/dkg-cli)
- [Polkadot Governance](https://polkadot.network/features/governance/)

---
