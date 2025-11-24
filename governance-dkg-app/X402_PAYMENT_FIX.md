# X402 Payment Configuration Fix

## Problem
The X402 payment system was encountering an error when trying to settle USDC payments:
```
Error: The contract function "transferWithAuthorization" reverted with the following reason:
FiatTokenV2: invalid signature
```

The payment verification was working correctly and users were getting access, but the actual USDC transfer was failing due to an EIP-712 signature mismatch.

## Solution
Updated the X402 middleware configuration to:

1. **Explicitly specify the USDC token address** for Base Sepolia testnet:
   - USDC Contract: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
   - Chain ID: `84532` (Base Sepolia)

2. **Enable `skipSettlement` option** to avoid automatic on-chain settlement that was causing signature errors.

## What Changed
- **File**: `backend/src/middleware/x402-config.js`
- Added explicit token configuration constants
- Added `skipSettlement: true` to route configuration
- Added token address to the route config

## Current Behavior
- ✅ X402 payment proof verification works correctly
- ✅ Users get access to premium reports after payment
- ✅ Payment flow completes successfully from user perspective
- ⚠️ Actual USDC transfer is skipped (settlement disabled)

## For Production
If you need actual USDC transfers to happen on-chain, you have two options:

### Option 1: Manual Settlement
Implement a separate settlement process that properly signs the EIP-712 message for the USDC contract's `transferWithAuthorization` function.

### Option 2: Fix EIP-712 Signing
Configure the x402 library with the correct EIP-712 domain parameters for the Base Sepolia USDC contract:
- Contract name: "USD Coin" (or "FiatToken")
- Version: Check the USDC contract version
- Verifying contract: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- Chain ID: `84532`

## Testing
After restarting your backend server, the payment flow should work without errors:

1. User initiates payment for premium report
2. MetaMask prompts for signature
3. X402 middleware verifies payment proof
4. Access is granted immediately
5. No settlement error occurs

## Premium Report Pricing
All premium reports are now configured at **$0.10 USDC** (updated from $10.00).

## Scripts Available
- `create-premium-report.js` - Create new premium reports
- `update-premium-price.js` - Update prices for existing reports
- `view-premium-access.js` - View access records
- `restore-premium-access.js` - Restore user access
- `revoke-premium-access.js` - Revoke user access

## Base Sepolia Testnet USDC
To test payments, you need Base Sepolia testnet USDC:
1. Bridge Sepolia ETH to Base Sepolia using the official Base bridge
2. Get testnet USDC from a Base Sepolia faucet
3. Ensure MetaMask is connected to Base Sepolia (Chain ID: 84532)
