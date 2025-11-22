# Premium Reports - User Guide

## Overview

The Premium Reports feature allows users to create, submit, and monetize in-depth analysis reports for governance proposals. Other users can discover these reports and pay TRAC tokens to access them.

## Features

### For Report Authors

1. **Create Premium Reports**
   - Submit detailed analysis and insights about proposals
   - Set your own price in TRAC tokens
   - Choose between premium (paid) or free reports
   - All reports undergo AI verification

2. **Monetization**
   - Earn TRAC tokens when users purchase access to your reports
   - Set competitive prices based on report quality and depth
   - Track who has purchased your reports

### For Report Consumers

1. **Discover Premium Reports**
   - Browse available premium reports for each proposal
   - See preview information: author type, price, submission date
   - View reports on the DKG if they have a UAL

2. **Purchase Access**
   - Pay with TRAC tokens via wallet signature
   - X402 payment protocol for secure transactions
   - Instant access upon successful payment verification

## How to Use

### 1. Connect Your Wallet

Before submitting or purchasing reports, you must connect your wallet:

- Click "Connect Wallet" button on the proposal detail page
- Sign the authentication message with MetaMask
- Your wallet address will be displayed when connected

### 2. Submit a Premium Report

**Step-by-step:**

1. Navigate to a proposal detail page (the proposal must be published to DKG first)
2. Scroll to the "Submit Premium Report" section
3. Click "Create Premium Report" button
4. Fill in the form:
   - **Report Name** (optional): Give your report a descriptive title
   - **Report Data (JSON-LD)** (required): Your analysis in JSON-LD format
     - Click "Load Example" to see a template
   - **Make this a premium report**: Check if you want to charge for access
   - **Premium Price (TRAC)**: Set your price (e.g., 10 TRAC)
5. Click "Submit Premium Report"
6. Wait for AI verification
7. Your report will be published to the DKG upon approval

**Example Premium Report Structure:**

```json
{
  "@context": {
    "schema": "https://schema.org/",
    "polkadot": "https://polkadot.network/governance/",
    "dkg": "https://dkg.origintrail.io/"
  },
  "@type": "dkg:PremiumReport",
  "@id": "polkadot:referendum:123:premium-report:1234567890",
  "schema:name": "Expert Economic Analysis",
  "schema:description": "Comprehensive analysis of proposal economics and feasibility",
  "schema:about": "polkadot:referendum:123",
  "dkg:reportType": "premium",
  "dkg:analysis": {
    "executiveSummary": "Summary of findings...",
    "technicalAssessment": {
      "feasibility": "High",
      "complexity": "Medium",
      "risks": ["Risk 1", "Risk 2"],
      "opportunities": ["Opportunity 1", "Opportunity 2"]
    },
    "financialAnalysis": {
      "budgetAssessment": "Assessment details...",
      "roi": "Expected ROI details..."
    },
    "recommendations": ["Recommendation 1", "Recommendation 2"]
  },
  "schema:author": {
    "@type": "schema:Person",
    "schema:identifier": "0xYourWalletAddress"
  },
  "schema:dateCreated": "2025-01-22T12:00:00Z"
}
```

### 3. Purchase a Premium Report

**Step-by-step:**

1. Navigate to a proposal detail page
2. Scroll to the "Premium Reports" section
3. Browse available reports
4. For reports you don't have access to:
   - Click the "Pay X TRAC" button
   - Sign the payment message with MetaMask
   - Wait for payment verification
5. Once verified, click "View Full Report" to see the complete content

### 4. View Your Premium Reports

Reports you've purchased or authored will show:
- Green "You have access to this report" badge
- "View Full Report" button to view full JSON-LD content
- Link to view on DKG Explorer (if published)

## Author Types

- **Official**: Reports from verified admin addresses
- **Community**: Reports from regular community members

Admin addresses are configured in the backend `.env` file:
```
ADMIN_ADDRESSES=0x1234...,0x5678...
```

## Payment Flow (X402 Protocol)

The premium reports use the X402 micropayment protocol:

1. **Payment Request**: User clicks "Pay" button
2. **Message Generation**: Backend generates a unique payment message
3. **Signature**: User signs the message with their wallet
4. **Verification**: Backend verifies the signature matches the wallet
5. **Access Grant**: User receives immediate access to the report

## Report Verification

All submitted reports undergo AI verification:

1. **Automatic Verification**: AI agent analyzes report quality and relevance
2. **Status Updates**:
   - `pending`: Awaiting verification
   - `verified`: Approved and published to DKG
   - `rejected`: Failed verification (with reasoning)
3. **DKG Publication**: Verified reports are automatically published to the DKG

## API Endpoints

### Submit Premium Report
```
POST /api/premium-reports/submit
Headers:
  - x-wallet-address: Your wallet address
  - x-wallet-signature: Signature of auth message (Base64)
  - x-wallet-message: Auth message (Base64 encoded)
Body:
  - referendum_index: Proposal ID
  - report_name: Report title
  - jsonld_data: JSON-LD report content
  - is_premium: true/false
  - premium_price_trac: Price in TRAC
```

### Get Premium Reports for Proposal
```
GET /api/premium-reports/proposal/:referendum_index
Headers: (optional authentication)
  - x-wallet-address
  - x-wallet-signature
  - x-wallet-message
```

### Request Access to Premium Report
```
POST /api/premium-reports/:reportId/request-access
Body:
  - wallet: User wallet address
  - signature: Payment signature
  - message: Payment message
  - tx_hash: Optional on-chain transaction hash
```

### Get Full Premium Report
```
GET /api/premium-reports/:reportId
Headers: (authentication required)
  - x-wallet-address
  - x-wallet-signature
  - x-wallet-message
Returns: 402 Payment Required if user doesn't have access
```

## Best Practices

### For Authors

1. **Quality First**: Create detailed, well-researched reports
2. **Competitive Pricing**: Set prices that reflect the value you provide
3. **Clear Titles**: Use descriptive report names
4. **Link to Proposal**: Always reference the parent proposal UAL in your JSON-LD
5. **Expert Insights**: Provide analysis that goes beyond public information

### For Consumers

1. **Review Metadata**: Check author type, date, and price before purchasing
2. **Check DKG Explorer**: View the report's DKG knowledge asset if available
3. **Verify Author**: Look for "Official" badges for admin-verified reports

## Troubleshooting

### "Please connect your wallet first"
- Click the "Connect Wallet" button at the top of the proposal page
- Approve the connection in MetaMask
- Sign the authentication message

### "Authentication required" error
- Your authentication may have expired (5 minutes timeout)
- Disconnect and reconnect your wallet

### "Invalid JSON-LD format"
- Ensure your JSON is valid (use a JSON validator)
- Include required fields: `@context` and `@type`
- Use the "Load Example" button to see a valid template

### "Payment verification failed"
- Ensure you're using the correct wallet
- Try disconnecting and reconnecting your wallet
- Check that you have sufficient TRAC balance (for future on-chain payments)

### Report not appearing after submission
- Reports undergo AI verification before publication
- Check back in a few minutes
- Rejected reports will show an error message with reasoning

## Security

- **Wallet Signatures**: All authentication uses cryptographic signatures
- **No Private Keys**: Your private keys never leave your wallet
- **Base64 Encoding**: Messages are Base64-encoded for HTTP header safety
- **Timestamp Validation**: Authentication messages expire after 5 minutes
- **Payment Messages**: Separate signature required for each payment

## Future Enhancements

- On-chain TRAC token payments
- Report reputation and rating system
- Author profiles and earnings dashboard
- Report categories and tags
- Search and filter functionality
- Subscription models for authors
- Revenue sharing for platform

## Support

For issues or questions:
- Check the browser console for detailed error messages
- Ensure your wallet is connected and has the correct network
- Verify the proposal is published to DKG before submitting reports

---

**Note**: This is a demonstration implementation. In production, integrate actual TRAC token payments on-chain and implement comprehensive payment verification.
