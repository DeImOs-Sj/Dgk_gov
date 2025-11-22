#!/bin/bash

# Polkadot Governance DKG - Quick Start Script

echo "🚀 Starting Polkadot Governance DKG Application..."
echo ""

# Kill any existing processes on ports 3000 and 3001
echo "🧹 Cleaning up existing processes..."
lsof -ti :3001 | xargs kill -9 2>/dev/null || true
lsof -ti :3000 | xargs kill -9 2>/dev/null || true
sleep 1

# Check if database exists
if [ ! -f "database/governance.db" ]; then
    echo "📊 Database not found. Setting up..."
    cd backend
    node src/scripts/setup-database.js
    node src/scripts/import-proposals.js
    cd ..
    echo ""
fi

# Start backend and frontend concurrently
echo "🔧 Starting backend server (port 3001) and frontend (port 3000)..."
echo ""
echo "📡 Backend will be available at: http://localhost:3001"
echo "🌐 Frontend will be available at: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

npm run dev
