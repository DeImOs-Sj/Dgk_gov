/**
 * Bulk Asset Publisher
 *
 * This script publishes 2000 simple JSON-LD assets to the DKG Publisher API
 * with dynamic data based on index.
 *
 * Usage:
 *   node publish-bulk-assets.js
 *
 * Environment variables:
 *   API_URL - Base URL for the API (default: http://localhost:3000)
 *   BATCH_SIZE - Number of assets to publish in parallel (default: 10)
 *   TOTAL_ASSETS - Total number of assets to publish (default: 2000)
 */

const API_URL = process.env.API_URL || 'http://localhost:9200';
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '250');
const TOTAL_ASSETS = parseInt(process.env.TOTAL_ASSETS || '500');

/**
 * Generate a simple JSON-LD asset with dynamic data
 */
function generateAsset(index) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `Test Asset #${index}`,
    description: `This is a test asset created for bulk publishing - Asset number ${index}`,
    identifier: `test-asset-${index}`,
    version: '1.0.0',
    dateCreated: new Date().toISOString(),
    creator: {
      '@type': 'Organization',
      name: 'DKG Publisher Test Suite',
    },
    keywords: [
      'test',
      'bulk-publish',
      `asset-${index}`,
      `batch-${Math.floor(index / BATCH_SIZE)}`,
    ],
    properties: {
      index: index,
      batchNumber: Math.floor(index / BATCH_SIZE),
      timestamp: Date.now(),
      randomValue: Math.random().toString(36).substring(7),
    },
  };
}

/**
 * Publish a single asset to the API
 */
async function publishAsset(index) {
  const content = generateAsset(index);

  const payload = {
    content,
    metadata: {
      source: 'bulk-publisher-script',
      sourceId: `bulk-${index}`,
    },
    publishOptions: {
      privacy: 'public',
      priority: 50,
      epochs: 2,
      maxAttempts: 3,
    },
  };

  try {
    const response = await fetch(`${API_URL}/api/dkg/assets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const result = await response.json();
    return {
      success: true,
      index,
      id: result.id,
      status: result.status,
    };
  } catch (error) {
    return {
      success: false,
      index,
      error: error.message,
    };
  }
}

/**
 * Sleep helper function
 */
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Publish assets in batches with delays between each publish
 */
async function publishBatch(startIndex, batchSize) {
  const results = [];

  for (let i = 0; i < batchSize; i++) {
    const index = startIndex + i;
    if (index > TOTAL_ASSETS) break;

    // Publish asset
    const result = await publishAsset(index);
    results.push(result);

    // Add small delay between publishes (50ms) to avoid overwhelming the API
    // and to ensure timestamps are different
    if (i < batchSize - 1 && index < TOTAL_ASSETS) {
      await sleep(50);
    }
  }

  return results;
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting bulk asset publishing...');
  console.log(`📊 Configuration:`);
  console.log(`   - API URL: ${API_URL}`);
  console.log(`   - Total assets: ${TOTAL_ASSETS}`);
  console.log(`   - Batch size: ${BATCH_SIZE}`);
  console.log(`   - Total batches: ${Math.ceil(TOTAL_ASSETS / BATCH_SIZE)}`);
  console.log('');

  const startTime = Date.now();
  let successCount = 0;
  let failureCount = 0;
  const errors = [];

  // Process in batches
  for (let i = 1; i <= TOTAL_ASSETS; i += BATCH_SIZE) {
    const batchNumber = Math.ceil(i / BATCH_SIZE);
    const batchSize = Math.min(BATCH_SIZE, TOTAL_ASSETS - i + 1);

    console.log(`\n📦 Processing batch ${batchNumber}/${Math.ceil(TOTAL_ASSETS / BATCH_SIZE)} (assets ${i}-${i + batchSize - 1})...`);

    const results = await publishBatch(i, batchSize);

    // Count successes and failures
    for (const result of results) {
      if (result.success) {
        successCount++;
        console.log(`   ✅ Asset ${result.index} -> ID ${result.id} (${result.status})`);
      } else {
        failureCount++;
        errors.push({ index: result.index, error: result.error });
        console.log(`   ❌ Asset ${result.index} failed: ${result.error}`);
      }
    }

    // Show progress
    const totalProcessed = successCount + failureCount;
    const percentage = ((totalProcessed / TOTAL_ASSETS) * 100).toFixed(1);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const rate = (totalProcessed / elapsed).toFixed(1);

    console.log(`\n📈 Progress: ${totalProcessed}/${TOTAL_ASSETS} (${percentage}%) - ${rate} assets/sec`);
  }

  // Final summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  const avgRate = (successCount / duration).toFixed(1);

  console.log('\n' + '='.repeat(80));
  console.log('📊 FINAL SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Successful: ${successCount}/${TOTAL_ASSETS}`);
  console.log(`❌ Failed: ${failureCount}/${TOTAL_ASSETS}`);
  console.log(`⏱️  Duration: ${duration}s`);
  console.log(`📈 Average rate: ${avgRate} assets/sec`);

  if (errors.length > 0) {
    console.log(`\n❌ Failed assets (${errors.length}):`);
    errors.slice(0, 10).forEach(({ index, error }) => {
      console.log(`   - Asset ${index}: ${error}`);
    });
    if (errors.length > 10) {
      console.log(`   ... and ${errors.length - 10} more errors`);
    }
  }

  console.log('='.repeat(80));
  console.log(successCount === TOTAL_ASSETS ? '🎉 All assets published successfully!' : '⚠️  Some assets failed to publish');

  process.exit(failureCount > 0 ? 1 : 0);
}

// Run the script
main().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
