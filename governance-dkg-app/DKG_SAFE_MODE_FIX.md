# DKG Safe Mode Validation Error - Fix

## Problem

Premium reports were failing to publish to the DKG with error:
```
HTTP 500: {"success":false,"error":"Safe mode validation error."}
```

## Root Cause

The DKG operates in "safe mode" which requires JSON-LD assets to have a specific structure with all required fields:

1. **Valid @context** with known vocabularies (schema.org, etc.)
2. **Recognized @type** (schema:Report, schema:Proposal, etc.)
3. **Proper @id** structure
4. **Required fields**:
   - `schema:name`
   - `schema:dateCreated`
   - `schema:about` (for reports)

User-submitted JSON-LD might be missing some of these required fields, causing validation to fail.

## Solution

Implemented a JSON-LD normalization wrapper that ensures all required fields are present before publishing to DKG:

```javascript
// Wrap user content in a standardized structure
const dkgReadyJsonLD = {
  "@context": reportJsonLD["@context"] || {
    "schema": "https://schema.org/",
    "polkadot": "https://polkadot.network/governance/",
    "dkg": "https://dkg.origintrail.io/"
  },
  "@type": reportJsonLD["@type"] || "schema:Report",
  "@id": reportJsonLD["@id"] || `polkadot:referendum:${referendum_index}:premium-report:${reportId}`,
  "schema:name": reportJsonLD["schema:name"] || reportJsonLD.name || `Premium Report ${reportId}`,
  "schema:about": reportJsonLD["schema:about"] || `polkadot:referendum:${referendum_index}`,
  "schema:dateCreated": reportJsonLD["schema:dateCreated"] || new Date().toISOString(),
  "dkg:reportType": "premium",
  "dkg:reportId": reportId,
  "dkg:premiumPrice": premium_price_trac,
  "dkg:payeeWallet": payee_wallet,
  // Include all other user-provided fields
  ...reportJsonLD
};
```

## How It Works

1. **Checks for required fields** in user-submitted JSON-LD
2. **Provides defaults** if fields are missing
3. **Merges user data** with required structure using spread operator
4. **Ensures compatibility** with DKG safe mode validation

## Benefits

- ✅ User can submit simple or complex JSON-LD
- ✅ System ensures DKG compatibility
- ✅ Preserves all user-provided data
- ✅ Adds metadata (reportId, price, payee)
- ✅ No breaking changes to existing API

## Updated Routes

1. **Auto-publish on submission** (`POST /api/premium-reports/submit`)
   - Now normalizes JSON-LD before DKG publication

2. **Manual verify-and-publish** (`POST /api/premium-reports/:id/verify-and-publish`)
   - Also normalizes JSON-LD before publication

## Testing

To test the fix with report #14 (or any pending report):

```bash
POST http://localhost:3001/api/premium-reports/14/verify-and-publish

Headers:
  x-wallet-address: <your-wallet>
  x-wallet-signature: <your-signature>
  x-wallet-message: <base64-encoded-message>
```

## Example: Minimal User Input

User can now submit minimal JSON-LD:

```json
{
  "name": "My Analysis",
  "analysis": "This is my detailed analysis..."
}
```

System will normalize it to:

```json
{
  "@context": {
    "schema": "https://schema.org/",
    "polkadot": "https://polkadot.network/governance/",
    "dkg": "https://dkg.origintrail.io/"
  },
  "@type": "schema:Report",
  "@id": "polkadot:referendum:1766:premium-report:14",
  "schema:name": "My Analysis",
  "schema:about": "polkadot:referendum:1766",
  "schema:dateCreated": "2025-11-22T16:00:00.000Z",
  "dkg:reportType": "premium",
  "dkg:reportId": 14,
  "dkg:premiumPrice": 10,
  "dkg:payeeWallet": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "name": "My Analysis",
  "analysis": "This is my detailed analysis..."
}
```

## Required DKG Fields Checklist

For future reference, DKG safe mode requires:

- [x] `@context` - Vocabulary definitions
- [x] `@type` - Asset type (must be recognized)
- [x] `@id` - Unique identifier
- [x] `schema:name` - Human-readable name
- [x] `schema:dateCreated` - ISO 8601 timestamp
- [x] `schema:about` - What the report is about (for reports)

## Future Improvements

1. **Validation before submission**
   - Frontend could validate JSON-LD structure
   - Show warnings for missing recommended fields

2. **Rich editor**
   - Visual editor for non-technical users
   - Generates compliant JSON-LD automatically

3. **Templates**
   - Pre-built templates for different report types
   - Technical analysis, financial review, community feedback, etc.

4. **DKG schema registry**
   - Query DKG for supported types
   - Dynamic validation based on schema

## Files Modified

- `backend/src/routes/premium-reports.js`
  - Submit route (line ~269-290)
  - Verify-and-publish route (line ~446-464)

## Deployment

Changes are backwards compatible. Simply restart the backend server to apply:

```bash
cd backend
npm run dev
```

Existing pending reports can be processed using the manual verify-and-publish endpoint.
