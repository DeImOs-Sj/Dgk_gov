# X402 Premium Reports Implementation

## Overview

This document describes the X402 payment-based premium reports feature implemented for the Polkadot Governance DKG application. This feature allows users to create and access premium governance analysis reports through a payment mechanism using TRAC tokens on the OriginTrail Parachain.

## Architecture

### Design Decisions

1. **Payment Method**: Signed message verification (instead of on-chain verification)
   - Faster user experience
   - No gas fees for authentication
   - Signature proves wallet ownership and payment intent

2. **Authors**: Both admin and community members can create premium reports
   - Admins: Identified via `ADMIN_ADDRESSES` environment variable
   - Community: Any verified wallet can create premium reports

3. **Access Control**: Single-tier pay-per-view model
   - Users pay once to permanently access a specific premium report
   - Price set per report by the author

4. **Network**: OriginTrail Parachain with TRAC tokens
   - Seamless integration with DKG infrastructure
   - Aligned with existing proposal publishing workflow

## Database Schema

### Tables Added

#### 1. `reports` table (extended)
New fields added:
```sql
is_premium BOOLEAN DEFAULT 0
premium_price_trac REAL
author_type TEXT DEFAULT 'community'  -- 'community' or 'admin'
```

#### 2. `premium_report_access` table (new)
Tracks payment and access control:
```sql
CREATE TABLE premium_report_access (
  access_id INTEGER PRIMARY KEY,
  report_id INTEGER NOT NULL,
  user_wallet TEXT NOT NULL,
  payment_signature TEXT NOT NULL,
  payment_message TEXT NOT NULL,
  signature_verified BOOLEAN DEFAULT 0,
  access_granted BOOLEAN DEFAULT 0,
  access_granted_at TIMESTAMP,
  paid_amount_trac REAL NOT NULL,
  payment_tx_hash TEXT,
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. `ual_premium_reports` table (new)
Maps DKG-UALs to premium reports:
```sql
CREATE TABLE ual_premium_reports (
  mapping_id INTEGER PRIMARY KEY,
  proposal_ual TEXT NOT NULL,
  report_id INTEGER NOT NULL,
  report_ual TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Backend Implementation

### Core Services

#### 1. X402 Payment Service (`src/services/x402-payment-service.js`)

**Key Functions:**

- `generatePaymentMessage(reportId, userWallet, amount)`
  - Creates standardized message for user to sign
  - Includes timestamp to prevent replay attacks

- `verifySignature(message, signature, expectedAddress)`
  - Recovers address from signature
  - Validates signature matches expected wallet

- `processPremiumAccess(reportId, userWallet, signature, message, txHash)`
  - Verifies signature and message validity
  - Checks message timestamp (max 24 hours old)
  - Grants access if verification succeeds

- `getPremiumReportContent(reportId, userWallet)`
  - Returns full content if user has access
  - Returns HTTP 402 with payment info if access denied

**Message Format:**
```
Premium Report Access Payment
Report ID: {reportId}
Wallet: {userWallet}
Amount: {amount} TRAC
Timestamp: {timestamp}
Network: OriginTrail Parachain

By signing this message, I confirm my request to access this premium report.
```

#### 2. Authentication Middleware (`src/middleware/auth.js`)

**Middleware Functions:**

- `authenticateWallet(req, res, next)`
  - Required authentication for protected routes
  - Expects headers: `x-wallet-address`, `x-wallet-signature`, `x-wallet-message`
  - Validates signature and message timestamp (max 5 minutes)

- `optionalAuthenticateWallet(req, res, next)`
  - Optional authentication for content that varies by user
  - Continues without error if no auth headers present

- `requireAdmin(req, res, next)`
  - Checks if authenticated wallet is in `ADMIN_ADDRESSES`
  - Returns 403 if not admin

**Authentication Message Format:**
```
Sign this message to authenticate with the Polkadot Governance DKG Platform

Wallet: {walletAddress}
Timestamp: {timestamp}
Network: OriginTrail Parachain

This signature will not trigger any blockchain transaction or cost any gas fees.
```

### API Endpoints

#### Premium Reports Routes (`/api/premium-reports`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/auth-message/:wallet` | No | Generate authentication message |
| GET | `/proposal/:index` | Optional | Get premium reports for proposal |
| GET | `/:id` | Optional | Get specific report (402 if no access) |
| POST | `/submit` | Required | Submit new premium report |
| POST | `/:id/publish` | Required | Publish verified report to DKG |
| POST | `/:id/request-access` | No | Request access with payment signature |
| GET | `/:id/payment-message` | No | Get payment message for signing |
| GET | `/user/my-access` | Required | Get user's access records |
| GET | `/ual/:ual/linked-reports` | Optional | Get reports linked to proposal UAL |

#### Example: Request Access Flow

1. **Get Payment Message**
```bash
GET /api/premium-reports/123/payment-message?wallet=0xABC...
```

Response:
```json
{
  "success": true,
  "message": "Premium Report Access Payment\nReport ID: 123...",
  "reportId": 123,
  "wallet": "0xABC...",
  "amount": 5.0,
  "currency": "TRAC"
}
```

2. **Sign Message with Wallet**
```javascript
const signature = await signer.signMessage(message);
```

3. **Request Access**
```bash
POST /api/premium-reports/123/request-access
{
  "wallet": "0xABC...",
  "signature": "0x123...",
  "message": "Premium Report Access Payment...",
  "tx_hash": null  // Optional
}
```

Response:
```json
{
  "success": true,
  "accessId": 456,
  "reportId": 123,
  "reportUAL": "did:dkg:otp:20430/0x.../123",
  "message": "Access granted successfully"
}
```

4. **Access Report**
```bash
GET /api/premium-reports/123
Headers:
  x-wallet-address: 0xABC...
  x-wallet-signature: 0x123...
  x-wallet-message: Sign this message to authenticate...
```

Response:
```json
{
  "success": true,
  "report": {
    "report_id": 123,
    "report_name": "Comprehensive Analysis",
    "jsonld_data": "{...}",
    ...
  }
}
```

## Frontend Implementation

### Components

#### 1. WalletConnect Component (`src/components/WalletConnect.jsx`)

**Features:**
- MetaMask integration via ethers.js
- Automatic reconnection if wallet already connected
- Session storage for authentication persistence
- Event listeners for account/chain changes

**Props:**
- `onWalletConnected(wallet, signature, message)` - Callback on successful connection
- `onWalletDisconnected()` - Callback on disconnection

**Usage:**
```jsx
<WalletConnect
  onWalletConnected={(wallet, sig, msg) => {
    setUserWallet(wallet);
    setAuthSignature(sig);
    setAuthMessage(msg);
  }}
  onWalletDisconnected={() => {
    setUserWallet(null);
  }}
/>
```

#### 2. PremiumReports Component (`src/components/PremiumReports.jsx`)

**Features:**
- Display premium reports for a proposal
- Payment flow integration
- Access-based content filtering
- Full report viewing modal

**Props:**
- `proposalIndex` - Proposal referendum index
- `userWallet` - Connected wallet address
- `authSignature` - Authentication signature
- `authMessage` - Authentication message

**UI Flow:**

1. **No Access:**
   - Shows report metadata only
   - Displays price in TRAC
   - "Pay X TRAC" button triggers payment flow

2. **Payment Flow:**
   - Fetches payment message from backend
   - Prompts MetaMask signature
   - Submits signed message to backend
   - Refreshes view on success

3. **Has Access:**
   - Shows "Access Granted" badge
   - "View Full Report" button opens modal
   - Modal displays full JSON-LD content

**Usage:**
```jsx
<PremiumReports
  proposalIndex={proposal.referendum_index}
  userWallet={userWallet}
  authSignature={authSignature}
  authMessage={authMessage}
/>
```

### Integration in ProposalDetail

The ProposalDetail component integrates both components:

```jsx
// Wallet connection at top
<WalletConnect
  onWalletConnected={handleWalletConnected}
  onWalletDisconnected={handleWalletDisconnected}
/>

// Premium reports section (after proposal details)
{proposal.ual && (
  <PremiumReports
    proposalIndex={proposal.referendum_index}
    userWallet={userWallet}
    authSignature={authSignature}
    authMessage={authMessage}
  />
)}
```

## Configuration

### Environment Variables

Add to `backend/.env`:

```bash
# X402 Premium Reports
# Comma-separated list of admin wallet addresses
ADMIN_ADDRESSES=0x1234567890123456789012345678901234567890,0xabcdefabcdefabcdefabcdefabcdefabcdefabcd
```

### Dependencies

**Backend:**
```json
{
  "ethers": "^6.x"
}
```

**Frontend:**
```json
{
  "ethers": "^6.x"
}
```

## Security Considerations

### 1. Signature Verification
- All signatures verified server-side using ethers.js
- Address recovery prevents spoofing
- Timestamp validation prevents replay attacks

### 2. Message Validation
- Payment messages validated for correct report ID, wallet, and amount
- Auth messages expire after 5 minutes
- Payment messages expire after 24 hours

### 3. Access Control
- Access checks performed on every content request
- Database constraints prevent duplicate access records
- Admin status verified on every admin-only operation

### 4. Wallet Authentication
- Session storage (not localStorage) for auth data
- Auto-disconnect on account change
- Page reload on chain change

## Workflow Examples

### Admin Creates Premium Report

1. Admin connects wallet
2. Admin address is in `ADMIN_ADDRESSES` env var
3. Submits report with `is_premium: true` and `premium_price_trac: 10.0`
4. Report stored with `author_type: 'admin'`
5. AI verification runs automatically
6. Admin publishes verified report to DKG
7. UAL mapping created linking proposal UAL to report UAL

### User Purchases Access

1. User views proposal with premium reports
2. Sees premium report card with price
3. Clicks "Pay 10.0 TRAC"
4. MetaMask prompts to sign payment message
5. User signs message
6. Backend verifies signature
7. Access record created with `access_granted: true`
8. User can now view full report content

### Community Member Creates Premium Report

1. Community member connects wallet
2. Submits report with `is_premium: true` and `premium_price_trac: 5.0`
3. Report stored with `author_type: 'community'`
4. Same verification and publishing flow as admin
5. Community member earns from report sales (future feature)

## Future Enhancements

### 1. Actual On-Chain Payments
- Integrate TRAC token contract
- Verify payment transactions on-chain
- Escrow mechanism for report purchases

### 2. Revenue Sharing
- Split payments between platform and authors
- Community member earnings dashboard
- Automated payout system

### 3. Report Quality Metrics
- User ratings and reviews
- Purchase count tracking
- Featured premium reports

### 4. Subscription Model
- Monthly access to all premium reports
- Tiered subscription levels
- Bulk discounts

### 5. Report Previews
- Allow first paragraph/section for free
- Teaser content to encourage purchases
- Sample data visualizations

## Testing

### Manual Testing Checklist

#### Wallet Connection
- [ ] Connect MetaMask wallet
- [ ] Sign authentication message
- [ ] Verify connected wallet displays correctly
- [ ] Disconnect wallet
- [ ] Reconnect and verify session persistence
- [ ] Switch accounts and verify auto-disconnect

#### Premium Report Submission
- [ ] Submit premium report as admin
- [ ] Submit premium report as community member
- [ ] Verify `author_type` set correctly
- [ ] Verify AI verification triggers
- [ ] Publish verified report to DKG
- [ ] Verify UAL mapping created

#### Payment Flow
- [ ] View premium report without access
- [ ] Generate payment message
- [ ] Sign payment message with MetaMask
- [ ] Submit payment request
- [ ] Verify access granted
- [ ] View full report content
- [ ] Verify cannot pay again for same report

#### Access Control
- [ ] Access premium report without authentication → 402
- [ ] Access premium report without payment → 402
- [ ] Access premium report with payment → 200
- [ ] Access non-premium report → 200 (no payment)

#### API Testing
- [ ] Test all premium report endpoints
- [ ] Verify authentication headers
- [ ] Test signature verification
- [ ] Test message timestamp validation
- [ ] Test admin authorization

## API Documentation

### HTTP 402 Payment Required Response

When a user attempts to access premium content without payment:

```json
{
  "success": false,
  "error": "Payment required",
  "statusCode": 402,
  "paymentRequired": true,
  "reportId": 123,
  "reportName": "Premium Analysis Report",
  "price": 5.0,
  "currency": "TRAC",
  "reportUAL": "did:dkg:otp:20430/0x.../123",
  "metadata": {
    "report_id": 123,
    "report_name": "Premium Analysis Report",
    "referendum_index": 456,
    "author_type": "admin",
    "premium_price_trac": 5.0,
    "data_size_bytes": 15360,
    "verification_status": "verified",
    "submitted_at": "2025-01-15T10:30:00Z"
  }
}
```

## Troubleshooting

### Common Issues

**1. MetaMask not detected**
- Ensure MetaMask extension is installed
- Check browser compatibility
- Refresh page after installing MetaMask

**2. Signature verification fails**
- Check message timestamp hasn't expired
- Ensure signing with correct wallet
- Verify message format matches expected

**3. Admin features not working**
- Verify wallet address in `ADMIN_ADDRESSES` env var
- Check addresses are lowercase in comparison
- Ensure no extra whitespace in env var

**4. Premium reports not showing**
- Verify proposal has been published to DKG
- Check report has `is_premium: true`
- Ensure report has valid `report_ual`

## Conclusion

This X402 implementation provides a complete payment-based access control system for premium governance reports. It leverages Web3 wallet signatures for secure, gas-free authentication and access control, while maintaining compatibility with the existing DKG publishing infrastructure.

The system is designed to be extensible, with clear paths for adding on-chain payment verification, revenue sharing, and advanced content monetization features in the future.
