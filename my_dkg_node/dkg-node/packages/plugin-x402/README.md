# @dkg/plugin-x402

A DKG plugin that integrates x402 payment protocol for accessing paid APIs automatically. This plugin enables your DKG node to call x402-protected resource servers with automatic payment handling via HTTP 402 responses.

## Features

- **Automatic Payment Handling**: Detects HTTP 402 responses and processes payments automatically using a connected Ethereum wallet
- **MCP Tool Integration**: Exposes x402 functionality as MCP tools for AI agents to use
- **REST API Endpoints**: Provides HTTP endpoints for accessing x402-protected resources
- **Status Monitoring**: Check plugin configuration and initialization status

## Installation

The plugin is already integrated into your DKG node. It's registered in `apps/agent/src/server/index.ts`.

## Configuration

### Required Environment Variables

Add these to your `.env` file in `apps/agent/`:

```bash
# x402 Configuration
X402_PRIVATE_KEY=0x...                              # Your Ethereum wallet private key (with 0x prefix)
X402_RESOURCE_SERVER_URL=https://example.com        # Base URL of the x402-protected API
X402_ENDPOINT_PATH=/weather                         # Default endpoint path (optional)
```

### Environment Variable Details

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `X402_PRIVATE_KEY` | Yes | Ethereum private key for payment signing (Hex format with 0x prefix) | `0x1234...abcd` |
| `X402_RESOURCE_SERVER_URL` | Yes | Base URL of the x402-protected resource server | `https://api.example.com` |
| `X402_ENDPOINT_PATH` | No | Default endpoint path to call (can be overridden per request) | `/data` or `/weather` |

### Security Notes

- **Keep your private key secure!** Never commit it to version control
- Use a dedicated wallet for x402 payments with limited funds
- The private key should have sufficient Base network ETH for payments
- Consider using environment-specific keys (dev vs production)

## Usage

### MCP Tool: `x402-get-data`

Fetch data from an x402-protected resource server. The tool automatically handles payment if the server returns HTTP 402.

**Input Schema:**
```json
{
  "endpoint": "/optional/path"  // Optional: Override default endpoint
}
```

**Example (via AI Agent):**
```
User: "Get weather data from the x402 API"
Agent calls: x402-get-data with no parameters (uses X402_ENDPOINT_PATH)

User: "Get forecast data from /forecast endpoint"
Agent calls: x402-get-data with endpoint="/forecast"
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"temperature\": 72, \"condition\": \"sunny\"}"
    }
  ]
}
```

### REST API Endpoints

#### GET `/x402/data`

Fetch data from the x402-protected resource server.

**Query Parameters:**
- `endpoint` (optional): Endpoint path to call

**Example:**
```bash
curl "http://localhost:9200/x402/data?endpoint=/weather"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "temperature": 72,
    "condition": "sunny"
  }
}
```

#### GET `/x402/status`

Check the x402 plugin configuration and initialization status.

**Example:**
```bash
curl http://localhost:9200/x402/status
```

**Response:**
```json
{
  "initialized": true,
  "hasPrivateKey": true,
  "hasBaseURL": true,
  "hasEndpointPath": true,
  "baseURL": "https://example.com",
  "endpointPath": "/weather"
}
```

## How It Works

1. **Initialization**: On startup, the plugin reads environment variables and creates a wallet account from the private key
2. **Payment Interceptor**: Uses `x402-axios` library to intercept HTTP 402 responses
3. **Automatic Payment**: When a 402 response is received:
   - Plugin signs the payment transaction
   - Sends payment to the resource server
   - Retries the original request
   - Returns the data to the caller
4. **Base Network**: Payments are processed on Base (Coinbase L2) blockchain

## Integration with Governance DKG App

While the x402 plugin is not directly required for your governance DKG app's core functionality (fetching OpenGov proposals, creating DKG assets, etc.), it can be useful for:

### Potential Use Cases

1. **Premium Governance Analytics**
   - Access paid APIs for enhanced governance data
   - Fetch market data for treasury proposals
   - Get professional governance insights

2. **Cross-Chain Governance Data**
   - Access Base network governance information
   - Integrate with paid governance aggregators

3. **Monetizing Your Reports**
   - Flip the model: serve your verified governance reports as x402-protected APIs
   - Other developers pay to access your DKG-verified governance analysis

## Troubleshooting

### Plugin Not Initialized

If you see this error:
```
Error: x402 client not initialized. Please set X402_PRIVATE_KEY and X402_RESOURCE_SERVER_URL environment variables.
```

**Solution:**
1. Check your `.env` file has the required variables
2. Ensure the private key has `0x` prefix
3. Restart the server after adding environment variables

### Payment Failures

If payments fail:
1. Check your wallet has sufficient Base network ETH
2. Verify the resource server URL is correct
3. Ensure your private key is valid and has proper format
4. Check the resource server supports x402 protocol

### Endpoint Not Found

If you get 404 errors:
1. Verify the endpoint path is correct
2. Check if `X402_ENDPOINT_PATH` is set or pass `endpoint` parameter
3. Confirm the resource server has that endpoint

## Development

### Building the Plugin

```bash
npm run build --workspace=@dkg/plugin-x402
```

### Running Tests

```bash
npm run test --workspace=@dkg/plugin-x402
```

### Linting

```bash
npm run lint --workspace=@dkg/plugin-x402
```

## Dependencies

- `x402-axios`: ^0.7.0 - HTTP 402 payment interceptor
- `viem`: ^2.21.54 - Ethereum wallet and transaction handling
- `axios`: ^1.7.9 - HTTP client

## References

- [x402 MCP Server Docs](https://docs.cdp.coinbase.com/x402/mcp-server)
- [x402 Protocol Specification](https://github.com/coinbase/x402)
- [Base Network](https://base.org)
- [Viem Documentation](https://viem.sh)

## License

Part of the DKG ecosystem. See project license for details.
