# Premium Report Submission Flow - Updated

## Overview
The premium report submission flow has been refactored to follow the same pattern as regular reports: **Submit → Verify → Publish**

Previously, premium reports were auto-verifying and auto-publishing in a single `/submit` endpoint, which was incorrect. Now they follow a proper three-step process similar to regular reports.

## Changes Made

### Backend Changes (`backend/src/routes/premium-reports.js`)

#### 1. Updated `/submit` Endpoint (Line 159)
- **Before**: Auto-verified and auto-published reports to a NEW DKG UAL
- **After**: Only stores the report in the database with status `pending`
- Returns report metadata without triggering verification

#### 2. Added `/verify` Endpoint (Line 301)
- New endpoint: `POST /api/premium-reports/:id/verify`
- Triggers AI verification for a pending report
- Updates verification status to `verified` or `rejected`
- Does NOT publish automatically

#### 3. Updated `/publish` Endpoint (Line 569)
- **Before**: Created a NEW UAL using `publishAssetDirect()`
- **After**: Publishes to the **existing proposal UAL** using `publishAsset()`
- Uses `reportToJSONLD()` to properly link the report to the parent proposal
- Creates UAL mapping between proposal and report
- Only works if report is `verified`

### Frontend Changes (`frontend/src/components/SubmitPremiumReport.jsx`)

#### Updated `handleSubmit` Function (Line 161)
The form submission now follows a three-step process:

```javascript
// Step 1: Submit the report
POST /api/premium-reports/submit
// Returns: report_id

// Step 2: Auto-trigger verification
POST /api/premium-reports/{reportId}/verify
// Returns: verification status and reasoning

// Step 3: Auto-publish if verified
POST /api/premium-reports/{reportId}/publish
// Returns: DKG UAL and explorer URL
```

The user sees progress messages:
1. "Premium report submitted successfully! Processing..."
2. "Verifying report with AI..."
3. "Report verified! Publishing to DKG..."
4. "Premium report published to DKG! UAL: {ual}"

## Flow Comparison

### Before (Incorrect)
```
Submit → [Auto-verify + Auto-publish to NEW UAL] → Done
```
- Everything happened in one endpoint
- Created a NEW DKG UAL for each report
- Reports were not properly linked to proposal UAL

### After (Correct)
```
Submit → Verify → Publish to EXISTING proposal UAL → Done
```
- Three separate steps (like regular reports)
- Publishes to the existing proposal's UAL
- Proper UAL mapping and linkage

## Database Storage

Premium reports are stored with these additional fields:
- `is_premium`: 1 for premium, 0 for regular
- `premium_price_trac`: Price in TRAC tokens
- `payee_wallet`: Address that receives payments
- `author_type`: "admin" or "community"

## API Endpoints

### Submit Premium Report
```
POST /api/premium-reports/submit
Headers: x-wallet-address, x-wallet-signature, x-wallet-message
Body: {
  referendum_index,
  report_name,
  jsonld_data,
  is_premium: true,
  premium_price_trac: 10.0,
  payee_wallet: "0x..."
}
Response: {
  success: true,
  report: { report_id, verification_status: "pending", ... }
}
```

### Verify Premium Report
```
POST /api/premium-reports/:id/verify
Response: {
  success: true,
  verification: {
    status: "verified" | "rejected",
    confidence: 0.85,
    reasoning: "..."
  }
}
```

### Publish Premium Report
```
POST /api/premium-reports/:id/publish
Response: {
  success: true,
  message: "Premium report published to proposal's existing DKG UAL",
  dkg: {
    ual: "...",
    explorer_url: "..."
  },
  parent_ual: "..." // The proposal's UAL
}
```

## Testing

To test the new flow:

1. **Submit a premium report**
   - Connect wallet in UI
   - Fill in the premium report form
   - Click "Submit Premium Report"

2. **Verify it's stored correctly**
   - Check database: report should be `pending`
   - Should NOT have a UAL yet

3. **Verify automatic verification**
   - Frontend auto-triggers `/verify` endpoint
   - Check verification status in response

4. **Verify automatic publishing**
   - If verified, frontend auto-triggers `/publish`
   - Report should be added to existing proposal UAL
   - Check UAL mapping table

## Benefits of New Flow

1. **Consistency**: Same pattern as regular reports
2. **Proper UAL Management**: Each report gets its own UAL, linked to proposal via `schema:isPartOf`
3. **Better Error Handling**: Each step can fail independently
4. **Clearer Progress**: User sees each step happening
5. **Debugging**: Easier to debug which step failed
6. **Database Integrity**: Proper UAL mappings and relationships
7. **DKG Safe Mode Compatibility**: JSON-LD is normalized to ensure all required fields are present

## DKG Safe Mode Validation

The `/publish` endpoint now normalizes JSON-LD to ensure DKG safe mode compatibility:

**Required DKG Fields:**
- `@context` - Vocabulary definitions
- `@type` - Asset type (schema:Report)
- `@id` - Unique identifier
- `schema:name` - Human-readable name
- `schema:dateCreated` - ISO 8601 timestamp
- `schema:about` - What the report is about
- `schema:isPartOf` - Links to parent proposal UAL

The normalization ensures these fields are present even if the user's JSON-LD is incomplete.

## How UAL Linking Works

- **Proposal**: Gets its own UAL (e.g., `did:dkg:otp:20430/.../399691`)
- **Report**: Gets its own UAL (e.g., `did:dkg:otp:20430/.../399692`)
- **Linkage**: Report contains `"schema:isPartOf": "<proposal-ual>"` to establish relationship
- **UAL Mapping Table**: Stores the relationship for quick lookups

Reports are **separate DKG assets** linked to proposals, not embedded within the proposal asset.

## Notes

- The frontend still auto-triggers verification and publishing (maintains UX)
- The backend properly separates concerns (better architecture)
- Premium data (price, payee wallet) is preserved throughout the flow
- JSON-LD normalization ensures DKG safe mode compatibility
- Each report is a separate DKG asset with its own UAL, linked to the parent proposal
