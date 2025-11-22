/**
 * DKG Service - Interface with DKG Publisher API
 */
import dotenv from 'dotenv';

dotenv.config();

const DKG_API_URL = process.env.DKG_PUBLISHER_API_URL || 'http://localhost:9200';
const DKG_BLOCKCHAIN = process.env.DKG_BLOCKCHAIN || 'otp:20430';
const DKG_EXPLORER_BASE = process.env.DKG_EXPLORER_BASE || 'https://dkg.origintrail.io';

/**
 * Publish a Knowledge Asset to DKG
 */
export async function publishAsset(jsonldContent, metadata = {}) {
  try {
    const payload = {
      content: jsonldContent,
      metadata: {
        source: 'polkadot-governance-dkg',
        ...metadata
      },
      publishOptions: {
        privacy: 'public',
        priority: 50,
        epochs: 2,
        maxAttempts: 3
      }
    };

    console.log('\n' + '='.repeat(80));
    console.log('📤 PUBLISHING TO DKG');
    console.log('='.repeat(80));
    console.log(`🌐 API URL: ${DKG_API_URL}/api/dkg/assets`);
    console.log(`📦 Content Type: ${jsonldContent['@type'] || 'Unknown'}`);
    console.log(`📄 Content Name: ${jsonldContent['schema:name'] || jsonldContent.name || 'Untitled'}`);
    console.log(`📊 Payload Size: ${JSON.stringify(payload).length} bytes`);
    console.log(`⚙️  Options: privacy=${payload.publishOptions.privacy}, epochs=${payload.publishOptions.epochs}`);

    // Use fetch API instead of axios to avoid body locking issues
    const response = await fetch(`${DKG_API_URL}/api/dkg/assets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ DKG API Error Response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();

    console.log('\n✅ DKG PUBLISH SUCCESS:');
    console.log(`   Asset ID: ${result.id}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   UAL: ${result.ual || 'Pending...'}`);
    console.log('='.repeat(80) + '\n');

    return {
      success: true,
      id: result.id,
      status: result.status,
      ual: result.ual || null,
      data: result
    };
  } catch (error) {
    console.error('\n❌ DKG PUBLISH ERROR:');
    console.error(`   ${error.message}`);
    console.log('='.repeat(80) + '\n');

    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get asset status from DKG
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
 * Get asset by UAL from DKG
 */
export async function getAssetByUAL(ual) {
  try {
    const response = await fetch(`${DKG_API_URL}/api/dkg/assets/${ual}`);

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

export default {
  publishAsset,
  getAssetStatus,
  getAssetByUAL,
  getDKGExplorerURL
};
