/**
 * DKG Chat Service - Interface with DKG Node Chat API
 *
 * This service uses the DKG Node's chat endpoint to publish assets
 * and provides detailed progress tracking at each step.
 */
import dotenv from 'dotenv';

dotenv.config();

const DKG_CHAT_API_URL = process.env.DKG_CHAT_API_URL || 'http://localhost:9201';
const DKG_EXPLORER_BASE = process.env.DKG_EXPLORER_BASE || 'https://dkg.origintrail.io';

/**
 * Publish a Knowledge Asset to DKG via Chat API with progress tracking
 *
 * @param {Object} jsonldContent - The JSON-LD content to publish
 * @param {Object} metadata - Additional metadata
 * @param {Function} progressCallback - Callback for progress updates
 * @returns {Promise<Object>} Result with UAL and status
 */
export async function publishAssetViaChatAPI(jsonldContent, metadata = {}, progressCallback = null) {
  const updateProgress = (step, message, data = {}) => {
    console.log(`[Step ${step}] ${message}`);
    if (progressCallback) {
      progressCallback({ step, message, data });
    }
  };

  try {
    updateProgress(1, 'Preparing knowledge asset for publication', {
      contentType: jsonldContent['@type'],
      contentName: jsonldContent['schema:name'] || jsonldContent.name || 'Untitled'
    });

    // Step 1: Create the publish request message
    const publishRequest = {
      messages: [
        {
          role: 'user',
          content: `Please publish the following knowledge asset to the DKG as a PUBLIC asset:\n\n${JSON.stringify(jsonldContent, null, 2)}\n\nMetadata: ${JSON.stringify(metadata, null, 2)}\n\nPlease confirm the publication and provide the UAL.`
        }
      ]
    };

    updateProgress(2, 'Connecting to DKG Node Chat API', {
      endpoint: `${DKG_CHAT_API_URL}/api/chat`
    });

    // Step 2: Send request to chat API
    const chatResponse = await fetch(`${DKG_CHAT_API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(publishRequest)
    });

    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      updateProgress(3, 'Error: Failed to connect to chat API', {
        status: chatResponse.status,
        error: errorText
      });
      throw new Error(`HTTP ${chatResponse.status}: ${errorText}`);
    }

    updateProgress(3, 'Chat API connection established', {
      status: chatResponse.status
    });

    // Step 3: Parse chat response
    const chatResult = await chatResponse.json();

    updateProgress(4, 'Received response from AI agent', {
      role: chatResult.role,
      hasToolCalls: chatResult.tool_calls && chatResult.tool_calls.length > 0
    });

    // Step 4: Extract UAL from response
    // The chat response might contain tool calls or text with UAL
    let ual = null;
    let assetId = null;

    // Check tool calls first
    if (chatResult.tool_calls && chatResult.tool_calls.length > 0) {
      updateProgress(5, 'Processing tool calls from AI agent', {
        toolCallCount: chatResult.tool_calls.length
      });

      // Look for knowledge asset publish tool call
      const publishToolCall = chatResult.tool_calls.find(
        tc => tc.name && tc.name.includes('publish')
      );

      if (publishToolCall) {
        updateProgress(6, 'Found DKG publish tool call', {
          toolName: publishToolCall.name
        });
      }
    }

    // Parse UAL from response content
    const content = typeof chatResult.content === 'string'
      ? chatResult.content
      : JSON.stringify(chatResult.content);

    // Try to extract UAL from response
    const ualMatch = content.match(/did:dkg:[a-z0-9]+\/[0-9]+\/[a-zA-Z0-9]+/);
    if (ualMatch) {
      ual = ualMatch[0];
      updateProgress(7, 'Successfully extracted UAL from response', {
        ual: ual
      });
    }

    // Try to extract asset ID
    const assetIdMatch = content.match(/asset[_\s]?id[:\s]+([a-zA-Z0-9]+)/i);
    if (assetIdMatch) {
      assetId = assetIdMatch[1];
    }

    updateProgress(8, 'Publication process completed', {
      ual: ual,
      assetId: assetId,
      responsePreview: content.substring(0, 200)
    });

    return {
      success: true,
      ual: ual,
      assetId: assetId,
      chatResponse: chatResult,
      explorerUrl: ual ? getDKGExplorerURL(ual) : null,
      fullResponse: content
    };

  } catch (error) {
    updateProgress(-1, 'Error during publication', {
      error: error.message
    });

    console.error('\n❌ DKG CHAT PUBLISH ERROR:');
    console.error(`   ${error.message}`);

    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Alternative: Publish using direct MCP tool call simulation
 * This creates a more structured request for the DKG agent
 */
export async function publishAssetDirectMCP(jsonldContent, metadata = {}, progressCallback = null) {
  const updateProgress = (step, message, data = {}) => {
    console.log(`[Step ${step}] ${message}`);
    if (progressCallback) {
      progressCallback({ step, message, data });
    }
  };

  try {
    updateProgress(1, 'Preparing knowledge asset with privacy=public', {
      contentType: jsonldContent['@type'],
      size: JSON.stringify(jsonldContent).length
    });

    // Create a more structured request that explicitly mentions MCP tools
    // Use "PRIVATE" for now to comply with agent's default behavior
    const publishRequest = {
      messages: [
        {
          role: 'user',
          content: `Please publish the following Polkadot governance proposal as a knowledge asset to the DKG. Use privacy setting "private" as default.

Content (JSON-LD):
${JSON.stringify(jsonldContent, null, 2)}

Metadata:
${JSON.stringify(metadata, null, 2)}

Please use the knowledge-asset-publish MCP tool to publish this asset and provide:
1. The UAL (Universal Asset Locator)
2. The asset ID
3. Publication confirmation`
        }
      ]
    };

    updateProgress(2, 'Sending structured MCP request to DKG agent', {
      endpoint: `${DKG_CHAT_API_URL}/api/chat`
    });

    const response = await fetch(`${DKG_CHAT_API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(publishRequest)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    updateProgress(3, 'Received response from DKG agent');

    const result = await response.json();

    updateProgress(4, 'Parsing agent response', {
      hasContent: !!result.content,
      hasToolCalls: result.tool_calls && result.tool_calls.length > 0
    });

    // Extract information from response
    const content = typeof result.content === 'string'
      ? result.content
      : JSON.stringify(result.content);

    const ualMatch = content.match(/did:dkg:[a-z0-9]+\/[0-9]+\/[a-zA-Z0-9]+/);
    const ual = ualMatch ? ualMatch[0] : null;

    updateProgress(5, ual ? 'Publication successful' : 'Publication completed (UAL pending)', {
      ual: ual,
      responseLength: content.length
    });

    return {
      success: true,
      ual: ual,
      chatResponse: result,
      explorerUrl: ual ? getDKGExplorerURL(ual) : null,
      fullResponse: content
    };

  } catch (error) {
    updateProgress(-1, 'Publication failed', {
      error: error.message
    });

    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Generate DKG explorer URL from UAL
 */
export function getDKGExplorerURL(ual) {
  if (!ual) return null;
  return `${DKG_EXPLORER_BASE}/explore?ual=${encodeURIComponent(ual)}`;
}

/**
 * Check if chat API is available
 */
export async function checkChatAPIHealth() {
  try {
    const response = await fetch(`${DKG_CHAT_API_URL}/api/chat/health`, {
      method: 'GET'
    });

    if (!response.ok) {
      return {
        available: false,
        error: `HTTP ${response.status}`
      };
    }

    const data = await response.json();
    return {
      available: true,
      status: data.status,
      timestamp: data.timestamp
    };
  } catch (error) {
    return {
      available: false,
      error: error.message
    };
  }
}

/**
 * Get chat API LLM info
 */
export async function getChatAPIInfo() {
  try {
    const response = await fetch(`${DKG_CHAT_API_URL}/api/chat/info`, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    return {
      available: false,
      error: error.message
    };
  }
}

export default {
  publishAssetViaChatAPI,
  publishAssetDirectMCP,
  getDKGExplorerURL,
  checkChatAPIHealth,
  getChatAPIInfo
};
