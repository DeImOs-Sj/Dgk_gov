# Quick Start Guide

## Starting the Application

### Option 1: One-Command Start (Recommended)

```bash
cd /home/ssd/ot_hack/governance-dkg-app
./start.sh
```

This script will:
1. ✅ Kill any processes using ports 3000 or 3001
2. ✅ Check if database exists (creates it if needed)
3. ✅ Start both backend and frontend servers
4. ✅ Display URLs for accessing the app

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd /home/ssd/ot_hack/governance-dkg-app/backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd /home/ssd/ot_hack/governance-dkg-app/frontend
npm run dev
```

## Accessing the Application

Once started, open your browser to:

**Frontend (Main UI)**: http://localhost:3000

**Backend API**: http://localhost:3001

## First Time Setup

If this is your first time running the app, the database will be created automatically. You should see:

```
📊 Database not found. Setting up...
🚀 Setting up database...
✅ Database setup complete!
🚀 Importing proposals from CSV...
📊 Importing 1767 proposals...
✅ Import complete!
```

## Troubleshooting

### Port Already in Use

If you see `EADDRINUSE` error:

```bash
# Kill processes on ports
lsof -ti :3001 | xargs kill -9
lsof -ti :3000 | xargs kill -9

# Then restart
./start.sh
```

### Database Issues

```bash
# Reset database
rm database/governance.db*
cd backend
npm run setup-db
npm run import-proposals
cd ..
```

### Dependencies Not Installed

```bash
# Install all dependencies
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

## What to Do First

1. **Browse Proposals**
   - Open http://localhost:3000
   - See all 1,767 Polkadot proposals
   - Note statistics at the top

2. **View Referendum #5**
   - Click on "KILT Decentralized Identity Provider (DIP)"
   - This is the only proposal with a UAL currently
   - See the DKG Explorer link

3. **Submit a Test Report**
   - On Referendum #5 detail page
   - Scroll to "Submit Additional Report"
   - Click "Load Example" button
   - Enter a wallet address (e.g., `0x1234567890abcdef1234567890abcdef12345678`)
   - Click "Submit for Verification"
   - Watch the AI verification process
   - See the UAL generated if approved!

## Stopping the Application

Press `Ctrl+C` in the terminal where you ran `./start.sh`

Or manually:
```bash
lsof -ti :3001 | xargs kill -9
lsof -ti :3000 | xargs kill -9
```

## Next Steps

- Read [USAGE_GUIDE.md](USAGE_GUIDE.md) for detailed features
- Check [README.md](README.md) for architecture details
- Review [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) for technical overview

---

**Need Help?** Check the troubleshooting section in [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
