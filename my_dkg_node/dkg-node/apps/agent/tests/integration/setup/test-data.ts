/**
 * Test data and utilities for agent integration tests
 */

export const TEST_FILES = {
  smallText: {
    content: Buffer.from("Hello, DKG Agent Integration Test!"),
    filename: "test.txt",
    mimeType: "text/plain",
  },
  jsonData: {
    content: Buffer.from(
      JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Dataset",
        name: "Integration Test Dataset",
        description: "Test data for integration testing",
        creator: "DKG Agent Test Suite",
      }),
    ),
    filename: "test-dataset.json",
    mimeType: "application/json",
  },
  largeCsv: {
    content: Buffer.from(
      Array.from(
        { length: 1000 },
        (_, i) => `${i},test_value_${i},${Math.random()}`,
      ).join("\n"),
    ),
    filename: "large-test.csv",
    mimeType: "text/csv",
  },
  pdfDocument: {
    // Mock PDF header for testing binary files
    content: Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]),
    filename: "test-document.pdf",
    mimeType: "application/pdf",
  },
};

export const TEST_KNOWLEDGE_ASSETS = {
  simple: {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Test Organization",
    description: "A test organization for integration testing",
    url: "https://example.com",
  },
  withAttachments: {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: "Document Collection",
    description: "A knowledge asset that references uploaded files",
    hasPart: [], // Will be populated with file references
  },
  complexDataset: {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Research Dataset",
    description: "Complex dataset with multiple properties",
    creator: {
      "@type": "Organization",
      name: "Test Research Institute",
    },
    dateCreated: new Date().toISOString(),
    keywords: ["test", "integration", "dkg"],
    license: "https://creativecommons.org/licenses/by/4.0/",
  },
};

/**
 * OAuth test scenarios
 */
export const OAUTH_SCENARIOS = {
  fullAccess: {
    user: "admin",
    expectedScopes: ["mcp", "llm", "scope123", "blob"],
    canAccessProtected: true,
  },
  regularUser: {
    user: "user",
    expectedScopes: ["mcp", "blob"],
    canAccessProtected: false,
  },
  limitedUser: {
    user: "limited",
    expectedScopes: ["mcp"],
    canAccessProtected: false,
  },
};

/**
 * Creates test file with specified properties
 */
export function createTestFile(
  content: string | Buffer,
  filename: string,
  mimeType: string = "text/plain",
) {
  return {
    content: Buffer.isBuffer(content) ? content : Buffer.from(content),
    filename,
    mimeType,
    size: Buffer.isBuffer(content)
      ? content.length
      : Buffer.byteLength(content),
  };
}

/**
 * Generates large test data for performance testing
 */
export function generateLargeTestData(sizeKB: number): Buffer {
  const content = "x".repeat(1024); // 1KB of 'x'
  return Buffer.concat(Array(sizeKB).fill(Buffer.from(content)));
}

/**
 * Common assertions for integration tests
 */
export const ASSERTIONS = {
  validUAL: (ual: string) => {
    return /^did:dkg:[^:]+:[^:]+\/[^\/]+\/\d+$/.test(ual);
  },
  validBlobId: (id: string) => {
    // Blob IDs are UUID_filename format: e.g., "445144dd-51bd-409f-8b5b-e6ced3b402be_test-dataset.json"
    return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}_.*/.test(
      id,
    );
  },
  validTimestamp: (timestamp: string) => {
    return !isNaN(Date.parse(timestamp));
  },
  validAuthorizationCode: (code: string) => {
    return code.length > 10 && /^[A-Za-z0-9_-]+$/.test(code);
  },
  validAccessToken: (token: string) => {
    return token.length > 20 && /^[A-Za-z0-9_-]+$/.test(token);
  },
};

/**
 * Helper to create OAuth authorization flow test data
 */
export function createOAuthTestFlow(clientId: string = "test-client-id") {
  return {
    clientId,
    redirectUri: "http://localhost:3000/callback",
    scopes: ["mcp", "blob"],
    state: `test-state-${Date.now()}`,
    codeChallenge: "test-code-challenge-123",
    codeChallengeMethod: "plain",
  };
}

/**
 * MCP transport test utilities
 */
export const MCP_TEST_SCENARIOS = {
  basicConnection: {
    name: "test-client",
    version: "1.0.0-test",
  },
  withAuth: {
    name: "test-client-auth",
    version: "1.0.0-test",
    requiresAuth: true,
  },
};

/**
 * Performance test configurations
 */
export const PERFORMANCE_CONFIGS = {
  lightLoad: {
    concurrentUsers: 5,
    operationsPerUser: 10,
    maxFileSize: 1024, // 1KB
  },
  mediumLoad: {
    concurrentUsers: 10,
    operationsPerUser: 20,
    maxFileSize: 1024 * 100, // 100KB
  },
  heavyLoad: {
    concurrentUsers: 20,
    operationsPerUser: 50,
    maxFileSize: 1024 * 1024, // 1MB
  },
};
