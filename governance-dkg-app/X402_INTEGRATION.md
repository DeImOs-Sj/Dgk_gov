# X402 Payment Protocol Integration Guide

## Overview

This application now supports **X402 automatic crypto payments** for premium governance reports using **Base Sepolia testnet**. The integration enables seamless payments without manual transaction handling.

## What is X402?

X402 is a payment protocol built on HTTP that enables automatic crypto payments for web services. When a resource requires payment, the server returns HTTP 402 (Payment Required), and x402-compatible clients automatically handle the payment on-chain and retry the request.

**Key Benefits:**
- ✅ Automatic payment detection and processing
- ✅ Onchain payment verification via facilitator
- ✅ Seamless user experience with MetaMask
- ✅ Zero gas fees for the API server
- ✅ Built on standard HTTP protocols

## Architecture

### Backend (Seller Side)

**Location:** `governance-dkg-app/backend/`

**Components:**
1. **X402 Middleware** (`src/middleware/x402-config.js`)
   - Configures x402-express payment middleware
   - Dynamically generates route configurations per premium report
   - Each report has its own payee wallet address

2. **Protected Routes** (`src/routes/premium-reports.js`)
   - `POST /api/premium-reports/:id/request-access` - Protected by x402 middleware
   - Returns 402 if payment hasn't been made
   - Grants access after payment verification

**Configuration:**
```javascript
// src/middleware/x402-config.js
- Network: base-sepolia
- Facilitator: https://x402.org/facilitator
- Price conversion: 1 TRAC ≈ $0.01 USD (for testnet)
```

### Frontend (Buyer Side)

**Location:** `governance-dkg-app/frontend/`

**Components:**
1. **Payment Utility** (`src/utils/x402-payment.js`)
   - `requestPremiumAccessWithX402()` - Main payment function
   - Wraps fetch with x402 automatic payment capabilities
   - Integrates with MetaMask for signing

2. **UI Component** (`src/components/PremiumReports.jsx`)
   - Displays premium reports with pricing
   - Handles payment flow with user feedback
   - Shows payment status and access control

## How It Works

### Payment Flow

1. **User clicks "Pay" button** on a premium report
2. **Frontend makes POST request** to `/api/premium-reports/:id/request-access`
3. **Backend middleware returns 402** with payment requirements
4. **x402-fetch detects 402** and extracts payment info
5. **User signs transaction** via MetaMask on Base Sepolia
6. **Payment verified onchain** through x402 facilitator
7. **Request automatically retried** with payment proof header
8. **Backend verifies payment** and grants access
9. **User gains access** to premium report content

```
┌─────────────┐     ┌──────────────┐     ┌────────────┐     ┌──────────────┐
│   Browser   │────>│    Backend   │────>│ Facilitator│────>│ Base Sepolia │
│  (x402-    │<────│ (x402-express)│<────│  (Payment  │<────│   (Onchain)  │
│   fetch)    │     │   Middleware │     │ Verification)│     │   Verification│
└─────────────┘     └──────────────┘     └────────────┘     └──────────────┘
      ↑                                                              │
      └──────────────────── MetaMask Signs Tx ─────────────────────┘
```

## Setup Instructions

### Prerequisites

1. **MetaMask** installed in browser
2. **Base Sepolia testnet** configured in MetaMask
3. **Test USDC** on Base Sepolia for payments
4. **Node.js & npm** installed

### Backend Setup

```bash
cd governance-dkg-app/backend

# Install dependencies (already done)
npm install

# Environment variables (optional)
# Add to .env if you want to customize:
# X402_PAYEE_WALLET=0xYourDefaultWallet

# Start the backend
npm run dev
```

**Server will start with:**
```
🔐 X402 Payment middleware configured
   Facilitator: https://x402.org/facilitator
   Network: base-sepolia
```

### Frontend Setup

```bash
cd governance-dkg-app/frontend

# Install dependencies (already done)
npm install

# Start the frontend
npm run dev
```

## Testing the Integration

### Step 1: Setup MetaMask

1. Open MetaMask
2. Add Base Sepolia network:
   - Network Name: Base Sepolia
   - RPC URL: https://sepolia.base.org
   - Chain ID: 84532
   - Currency Symbol: ETH
3. Get test USDC from Base Sepolia faucet

### Step 2: Submit a Premium Report

1. Navigate to any proposal with a UAL
2. Connect your wallet using the WalletConnect component
3. Click "Create Premium Report" in the Submit Premium Report section
4. Fill in the form:
   - Report Name: Your report title
   - Report Data: JSON-LD data (or use "Load Example")
   - Payee Wallet: Your wallet address (auto-filled)
   - Premium Price: Set price in TRAC (e.g., 10)
5. Submit the report
6. Wait for AI verification and DKG publication

### Step 3: Purchase Access (Buyer Flow)

1. **As a different user**, connect wallet
2. Navigate to the same proposal
3. Scroll to "Premium Reports" section
4. See the payment banner explaining x402
5. Click **"Pay X TRAC"** button on a report
6. **MetaMask will prompt** for payment signature
7. **Sign the transaction** - payment happens automatically
8. **Wait for verification** (1-2 seconds)
9. **Access granted!** - Report becomes available

### Step 4: View Premium Content

After payment, click "View Full Report" to see the complete JSON-LD content.

## API Endpoints

### Premium Reports API

All endpoints are in `/api/premium-reports/`:

| Method | Endpoint | Description | X402 Protected |
|--------|----------|-------------|----------------|
| GET | `/proposal/:index` | List premium reports | ❌ |
| POST | `/submit` | Submit premium report | ❌ (Auth required) |
| POST | `/:id/request-access` | **Purchase access** | ✅ **X402 Payment** |
| GET | `/:id` | Get report content | ❌ (Returns 402 if no access) |
| GET | `/user/my-access` | User's purchased reports | ❌ (Auth required) |

## Configuration Options

### Backend Configuration

**Customize per-report pricing** in `src/middleware/x402-config.js`:

```javascript
function getReportPrice(reportId) {
  const report = reportQueries.getById(reportId);
  const tracPrice = report.premium_price_trac || 0;
  const usdPrice = tracPrice * 0.01; // Adjust conversion rate
  return `$${usdPrice.toFixed(3)}`;
}
```

**Change facilitator or network:**

```javascript
const FACILITATOR_URL = "https://x402.org/facilitator"; // For testnet
// For mainnet: import { facilitator } from "@coinbase/x402"

// Network in route config:
network: "base-sepolia" // or "base" for mainnet
```

### Frontend Configuration

**API Base URL** in components:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
```

Set in `.env`:
```
VITE_API_URL=http://your-backend-url:port
```

## Troubleshooting

### Common Issues

**"MetaMask not installed"**
- Install MetaMask browser extension
- Reload the page

**"Payment failed"**
- Check MetaMask is connected to Base Sepolia
- Ensure sufficient USDC balance on Base Sepolia
- Check browser console for detailed error logs

**"Network mismatch"**
- Switch MetaMask to Base Sepolia testnet
- Network ID should be 84532

**Backend returns 402 but payment doesn't work**
- Verify x402 middleware is loaded (check server startup logs)
- Ensure report has a valid `payee_wallet` address
- Check report is marked as `is_premium = 1` in database

**"Access granted but report doesn't load"**
- Refresh the page
- Check premium access in database: `SELECT * FROM premium_report_access WHERE user_wallet = 'YOUR_WALLET'`

### Debug Mode

Enable detailed logging in browser console:

```javascript
// In src/utils/x402-payment.js, add:
console.log('X402 Request:', url, options);
console.log('X402 Response:', response.status, response.headers);
```

Backend logs will show:
```
📡 POST /api/premium-reports/:id/request-access
🔐 X402 Payment middleware configured
✅ X402 Payment verified - Access granted to report X for 0xWallet...
```

## Migration to Production

### Moving to Mainnet

1. **Update backend configuration:**
   ```javascript
   // src/middleware/x402-config.js
   import { facilitator } from "@coinbase/x402";

   // Change network to:
   network: "base"
   ```

2. **Get real Base mainnet USDC** for testing

3. **Update price conversion:**
   ```javascript
   // Adjust based on real TRAC/USD price
   const usdPrice = tracPrice * actualTRACPrice;
   ```

4. **Set production environment variables:**
   ```bash
   NODE_ENV=production
   CDP_API_KEY_ID=your-key
   CDP_API_KEY_SECRET=your-secret
   ```

5. **Enable HTTPS** for both frontend and backend

6. **Test thoroughly** on testnet before mainnet deployment

## Resources

- **X402 Documentation:** https://docs.cdp.coinbase.com/x402/
- **X402 GitHub:** https://github.com/coinbase/x402
- **Base Sepolia Faucet:** https://faucet.quicknode.com/base/sepolia
- **Base Sepolia Explorer:** https://sepolia.basescan.org/

## Support

For issues or questions:
- Check backend logs: `npm run dev` output
- Check browser console for frontend errors
- Review x402 documentation
- Check MetaMask network configuration

---

**Built with X402 Payment Protocol** 🔐
*Enabling seamless crypto payments for the web*
