/**
 * MCP Client Service - Communicate with DKG node via Model Context Protocol
 *
 * This uses the same protocol as the DKG CLI to publish knowledge assets.
 * Protocol: JSON-RPC 2.0 over HTTP with Server-Sent Events (SSE)
 */
import dotenv from 'dotenv';

dotenv.config();

const MCP_URL = process.env.MCP_URL || 'http://localhost:3000/mcp';
const MCP_CLIENT_NAME = process.env.MCP_CLIENT_NAME || 'polkadot-governance-dkg';
const MCP_CLIENT_VERSION = process.env.MCP_CLIENT_VERSION || '1.0.0';

/**
 * MCP Session Manager
 */
class McpSession {
  constructor() {
    this.sessionId = null;
    this.accessToken = null;
  }

  /**
   * Initialize MCP session
   */
  async initialize() {
    try {
      console.log('\n🔌 Initializing MCP session...');
      console.log(`   URL: ${MCP_URL}`);
      console.log(`   Client: ${MCP_CLIENT_NAME} v${MCP_CLIENT_VERSION}`);

      const initPayload = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: MCP_CLIENT_NAME,
            version: MCP_CLIENT_VERSION
          }
        }
      };

      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream'
      };

      // Add authorization if token exists
      if (this.accessToken) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
      }

      const response = await fetch(MCP_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(initPayload)
      });

      // Extract session ID from response headers
      this.sessionId = response.headers.get('mcp-session-id');

      if (!this.sessionId) {
        throw new Error('No mcp-session-id received from server');
      }

      // Parse SSE response
      const responseText = await response.text();
      const result = this._parseSseResponse(responseText);

      console.log('✅ MCP session initialized');
      console.log(`   Session ID: ${this.sessionId}`);
      console.log(`   Server: ${result.result?.serverInfo?.name || 'Unknown'}`);

      return result;
    } catch (error) {
      console.error('❌ MCP initialization failed:', error.message);
      throw error;
    }
  }

  /**
   * Call an MCP tool
   */
  async callTool(toolName, toolArguments = {}) {
    if (!this.sessionId) {
      console.log('⚠️  No active session, initializing...');
      await this.initialize();
    }

    try {
      console.log(`\n🔧 Calling MCP tool: ${toolName}`);
      console.log(`   Arguments: ${JSON.stringify(toolArguments, null, 2).substring(0, 200)}...`);

      const callPayload = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: toolArguments
        }
      };

      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'mcp-session-id': this.sessionId
      };

      // Add authorization if token exists
      if (this.accessToken) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
      }

      const response = await fetch(MCP_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(callPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      // Parse SSE response
      const responseText = await response.text();
      const result = this._parseSseResponse(responseText);

      if (result.error) {
        throw new Error(`MCP tool error: ${result.error.message || JSON.stringify(result.error)}`);
      }

      console.log('✅ MCP tool call successful');
      console.log(`   Result: ${JSON.stringify(result.result, null, 2).substring(0, 200)}...`);

      return result.result;
    } catch (error) {
      console.error(`❌ MCP tool call failed:`, error.message);
      throw error;
    }
  }

  /**
   * Parse Server-Sent Events response
   */
  _parseSseResponse(text) {
    const lines = text.split('\n');

    // Find the data line (format: "data: {...}")
    const dataLine = lines.find(line => line.startsWith('data: '));

    if (!dataLine) {
      // If no SSE format, try parsing as plain JSON
      try {
        return JSON.parse(text);
      } catch (e) {
        throw new Error(`Invalid response format: ${text.substring(0, 200)}`);
      }
    }

    // Extract JSON from "data: {...}"
    const jsonStr = dataLine.substring(6); // Remove "data: " prefix
    return JSON.parse(jsonStr);
  }

  /**
   * Close session
   */
  async close() {
    this.sessionId = null;
    this.accessToken = null;
  }
}

/**
 * Singleton MCP client instance
 */
let mcpClient = null;

/**
 * Get or create MCP client
 */
function getMcpClient() {
  if (!mcpClient) {
    mcpClient = new McpSession();
  }
  return mcpClient;
}

/**
 * Publish a knowledge asset via MCP
 */
export async function publishKnowledgeAsset(jsonldContent, metadata = {}) {
  try {
    const client = getMcpClient();

    console.log('\n' + '='.repeat(80));
    console.log('📤 PUBLISHING TO DKG VIA MCP');
    console.log('='.repeat(80));
    console.log(`📦 Content Type: ${jsonldContent['@type'] || 'Unknown'}`);
    console.log(`📄 Content Name: ${jsonldContent['schema:name'] || jsonldContent.name || 'Untitled'}`);
    console.log(`📊 Content Size: ${JSON.stringify(jsonldContent).length} bytes`);

    // Call the knowledge-asset-publish tool
    const result = await client.callTool('knowledge-asset-publish', {
      content: jsonldContent,
      metadata: {
        source: 'polkadot-governance-dkg',
        ...metadata
      },
      privacy: 'public'
    });

    console.log('\n✅ DKG PUBLISH VIA MCP SUCCESS:');

    // Parse the tool result
    // Result format: { content: [{ type: "text", text: "Asset registered..." }] }
    let assetId = null;
    let status = null;

    if (result.content && result.content.length > 0) {
      const text = result.content[0].text;
      console.log(`   Response: ${text}`);

      // Extract asset ID from response text
      // Format: "Asset registered for publishing: 123 (Status: queued)"
      const idMatch = text.match(/Asset registered for publishing: (\d+)/);
      const statusMatch = text.match(/Status: (\w+)/);

      if (idMatch) assetId = parseInt(idMatch[1]);
      if (statusMatch) status = statusMatch[1];
    }

    console.log(`   Asset ID: ${assetId || 'Unknown'}`);
    console.log(`   Status: ${status || 'Unknown'}`);
    console.log('='.repeat(80) + '\n');

    return {
      success: true,
      id: assetId,
      status: status || 'queued',
      ual: null, // UAL will be available after publishing completes
      data: result
    };
  } catch (error) {
    console.error('\n❌ DKG PUBLISH VIA MCP ERROR:');
    console.error(`   ${error.message}`);
    console.log('='.repeat(80) + '\n');

    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get asset status via MCP (if available)
 */
export async function getAssetStatusViaMcp(assetId) {
  try {
    const client = getMcpClient();

    // Try to call a status tool if it exists
    // This may need adjustment based on available MCP tools
    const result = await client.callTool('knowledge-asset-status', {
      assetId: assetId
    });

    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('❌ Get asset status via MCP error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Close MCP connection
 */
export async function closeMcpConnection() {
  if (mcpClient) {
    await mcpClient.close();
    mcpClient = null;
  }
}

export default {
  publishKnowledgeAsset,
  getAssetStatusViaMcp,
  closeMcpConnection
};
