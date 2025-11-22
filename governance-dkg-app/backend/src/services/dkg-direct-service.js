/**
 * DKG Direct Service - Direct API calls to DKG Node REST API
 *
 * This service calls the DKG node's /api/dkg/assets endpoint directly
 * to publish knowledge assets without going through the chat interface.
 */
import dotenv from 'dotenv';

dotenv.config();

const DKG_API_URL = process.env.DKG_CHAT_API_URL || 'http://localhost:9201';
const DKG_EXPLORER_BASE = process.env.DKG_EXPLORER_BASE || 'https://dkg.origintrail.io';

/**
 * Publish a Knowledge Asset directly to DKG via REST API
 *
 * @param {Object} jsonldContent - The JSON-LD content to publish
 * @param {Object} metadata - Additional metadata
 * @param {Function} progressCallback - Callback for progress updates
 * @returns {Promise<Object>} Result with UAL and status
 */
export async function publishAssetDirect(jsonldContent, metadata = {}, progressCallback = null) {
  const updateProgress = (step, message, data = {}) => {
    console.log(`[Step ${step}] ${message}`);
    if (progressCallback) {
      progressCallback({ step, message, data });
    }
  };

  try {
    updateProgress(1, 'Preparing knowledge asset for DKG publication', {
      contentType: jsonldContent['@type'],
      contentName: jsonldContent['schema:name'] || jsonldContent.name || 'Untitled',
      size: JSON.stringify(jsonldContent).length
    });

    // Prepare the payload according to DKG API spec
    const payload = {
      content: jsonldContent,
      metadata: {
        source: 'polkadot-governance-dkg',
        ...metadata
      },
      publishOptions: {
        privacy: 'public',  // Public for transparency
        priority: 50,       // Medium priority
        epochs: 2,          // 2 blockchain epochs for finality
        maxAttempts: 3      // Retry up to 3 times
      }
    };

    updateProgress(2, 'Sending request to DKG Node API', {
      endpoint: `${DKG_API_URL}/api/dkg/assets`,
      privacy: payload.publishOptions.privacy,
      priority: payload.publishOptions.priority
    });

    // Call the DKG API
    const response = await fetch(`${DKG_API_URL}/api/dkg/assets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    updateProgress(3, 'Received response from DKG Node', {
      status: response.status,
      statusText: response.statusText
    });

    if (!response.ok) {
      const errorText = await response.text();
      updateProgress(-1, 'DKG API request failed', {
        status: response.status,
        error: errorText
      });
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();

    updateProgress(4, 'Parsing DKG response', {
      hasId: !!result.id,
      status: result.status
    });

    // The initial response gives us an asset ID and status
    // We need to poll for the UAL once publishing completes
    const assetId = result.id;
    const initialStatus = result.status;

    updateProgress(5, 'Asset registered in DKG publishing queue', {
      assetId: assetId,
      status: initialStatus
    });

    // If status is 'published', we already have the UAL
    if (result.ual) {
      updateProgress(6, 'Asset published successfully', {
        ual: result.ual,
        assetId: assetId
      });

      return {
        success: true,
        assetId: assetId,
        ual: result.ual,
        status: result.status,
        explorerUrl: getDKGExplorerURL(result.ual),
        fullResponse: result
      };
    }

    // Otherwise, poll for status
    updateProgress(6, 'Polling for publication status', {
      assetId: assetId,
      pollingInterval: '2 seconds'
    });

    const ual = await pollForUAL(assetId, updateProgress);

    if (ual) {
      updateProgress(8, 'Publication completed successfully', {
        ual: ual,
        assetId: assetId
      });

      return {
        success: true,
        assetId: assetId,
        ual: ual,
        status: 'published',
        explorerUrl: getDKGExplorerURL(ual),
        fullResponse: result
      };
    } else {
      updateProgress(8, 'Asset queued but UAL not yet available', {
        assetId: assetId,
        note: 'Check status later'
      });

      return {
        success: true,
        assetId: assetId,
        ual: null,
        status: 'pending',
        explorerUrl: null,
        fullResponse: result
      };
    }

  } catch (error) {
    updateProgress(-1, 'Error during publication', {
      error: error.message
    });

    console.error('\n❌ DKG DIRECT PUBLISH ERROR:');
    console.error(`   ${error.message}`);

    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Poll for asset status until UAL is available
 *
 * @param {string} assetId - The asset ID to check
 * @param {Function} progressCallback - Progress callback
 * @returns {Promise<string|null>} The UAL if found, null otherwise
 */
async function pollForUAL(assetId, progressCallback = null) {
  const maxAttempts = 15; // Poll for up to 30 seconds (15 * 2s)
  const pollInterval = 2000; // 2 seconds

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (progressCallback) {
        progressCallback({
          step: 7,
          message: `Checking publication status (attempt ${attempt}/${maxAttempts})`,
          data: { assetId }
        });
      }

      const response = await fetch(`${DKG_API_URL}/api/dkg/assets/status/${assetId}`);

      if (response.ok) {
        const status = await response.json();

        if (status.ual) {
          return status.ual;
        }

        if (status.status === 'failed') {
          throw new Error('Asset publication failed: ' + (status.error || 'Unknown error'));
        }

        // Still pending/queued/publishing, continue polling
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));

    } catch (error) {
      console.error('Error polling for UAL:', error.message);
      // Continue polling despite errors
    }
  }

  // Timeout reached
  return null;
}

/**
 * Get asset status from DKG
 *
 * @param {string} assetId - The asset ID
 * @returns {Promise<Object>} Asset status
 */
export async function getAssetStatus(assetId) {
  try {
    const response = await fetch(`${DKG_API_URL}/api/dkg/assets/status/${assetId}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('❌ Get asset status error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Retrieve an asset from DKG by UAL
 *
 * @param {string} ual - The Universal Asset Locator
 * @returns {Promise<Object>} Asset data
 */
export async function getAssetByUAL(ual) {
  try {
    const response = await fetch(`${DKG_API_URL}/api/dkg/assets?ual=${encodeURIComponent(ual)}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('❌ Get asset by UAL error:', error.message);
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
 * Check if DKG API is available
 */
export async function checkDKGAPIHealth() {
  try {
    // Try to access the DKG metrics endpoint as a health check
    const response = await fetch(`${DKG_API_URL}/api/dkg/metrics/queue`, {
      method: 'GET'
    });

    return {
      available: response.ok,
      status: response.status
    };
  } catch (error) {
    return {
      available: false,
      error: error.message
    };
  }
}

export default {
  publishAssetDirect,
  getAssetStatus,
  getAssetByUAL,
  getDKGExplorerURL,
  checkDKGAPIHealth
};
