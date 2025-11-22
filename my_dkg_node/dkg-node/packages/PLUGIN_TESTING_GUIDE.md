# DKG Plugin Testing Guide

**All plugin submissions should include comprehensive tests.** This guide shows you how to customize the auto-generated test template for your plugin.

## Why Testing Matters

Tests ensure your plugin works reliably and won't break when integrated with other plugins. They also make your plugin more trustworthy to the community! The good news: when you create a plugin with `turbo gen`, all testing setup is done automatically.

**Testing:** Your plugin needs 2 essential test categories to pass validation: **Core Functionality** and **Error Handling**. We automatically set up configuration tests and infrastructure. **The more comprehensive your testing, the better!** High-quality plugins with extensive test coverage are more trusted by the community.

## Auto-Generated Testing Setup

**Note:** Tests are automatically created when using `turbo gen` → "plugin" option, but not for `turbo gen` → "package" option.

**Important:** After creating your plugin, run `npm install` in the root directory to update package-lock.json.

When you create a plugin with `turbo gen` (plugin option), you automatically get:

**Complete Test Infrastructure (Works Automatically):**

- Test script in `package.json` - `npm test` ready to run
- Test file template - `tests/my-plugin.spec.ts`
- Mock setup - DKG context and MCP server mocks included
- Plugin Configuration tests - Basic validation that works for any plugin

**Placeholder Tests (Must Be Customized):**

- Core Functionality tests - Structure provided but content must be replaced
- Error Handling tests - Structure provided but content must be replaced

**Important:** Modern DKG plugins use the new `@dkg/plugins/testing` package that provides standardized testing utilities. When you create a plugin with `turbo gen`, these are automatically imported and configured.

## What You Need To Customize

**Important:** Run `npm test` after generation and you'll see failing tests with messages like:

```
Error: TODO: Replace placeholder test with your actual plugin functionality tests
```

This is intentional! You must replace the placeholder tests with real ones. Look for the `TODO` comments and replace them with actual tests for your plugin.

**Note:** GitHub Actions validates Core Functionality and Error Handling tests - if either are missing, it will fail.

## Required Test Categories

### 1. Core Functionality Tests (Replace the Placeholder!)

**GitHub Actions validates this exists.** Replace the placeholder test with your actual plugin functionality:

**For MCP Tools:**

```typescript
describe("Core Functionality", () => {
  it("should register the correct tools", async () => {
    const tools = await mockMcpClient.listTools().then((t) => t.tools);
    expect(tools.some((tool) => tool.name === "my-tool-name")).to.equal(true);
  });

  it("should handle tool calls correctly", async () => {
    const result = await mockMcpClient.callTool({
      name: "my-tool-name",
      arguments: { input: "test" },
    });
    expect(result.content[0].text).to.include("expected output");
  });
});
```

**For API Endpoints:**

```typescript
describe("API Endpoint", () => {
  it("should respond correctly", async () => {
    const response = await request(app).get("/my-endpoint").expect(200);
    expect(response.body).to.have.property("expectedField");
  });
});
```

### 2. Error Handling Tests (Replace the Placeholder!)

**GitHub Actions validates this exists.** Your generated test file includes a placeholder error handling test. Customize it for your plugin's specific error scenarios:

```typescript
describe("Error Handling", () => {
  it("should return 400 for missing parameters", async () => {
    await request(app).get("/my-endpoint").expect(400);
  });

  it("should handle invalid tool inputs", async () => {
    try {
      await mockMcpClient.callTool({
        name: "my-tool-name",
        arguments: { invalid: "input" },
      });
      expect.fail("Should have thrown error");
    } catch (error) {
      expect(error.message).to.include("expected error");
    }
  });
});
```

## Optional Test Enhancements

Beyond the 2 required categories, consider adding more comprehensive tests to make your plugin even more trustworthy:

```typescript
// More comprehensive testing examples:

describe("Edge Cases", () => {
  it("should handle very large inputs", async () => {
    // Test with large data sets
  });

  it("should handle special characters", async () => {
    // Test with unusual characters
  });
});

describe("Performance", () => {
  it("should respond quickly", async () => {
    // Test response times
  });
});

describe("Integration", () => {
  it("should work with other plugins", async () => {
    // Test plugin interactions
  });
});

describe("Security", () => {
  it("should validate inputs properly", async () => {
    // Test input sanitization
  });
});

describe("Blob Storage", () => {
  it("should handle file uploads correctly", async () => {
    // Test blob storage functionality if your plugin uses it
    const blobId = "test-blob-id";
    const testData = Buffer.from("test data");
    await mockDkgContext.blob.put(blobId, testData, {
      filename: "test.txt",
      mimeType: "text/plain",
    });

    const retrievedData = await mockDkgContext.blob.get(blobId);
    expect(retrievedData).to.not.be.null;
  });
});
```

**The more tests you write, the more trustworthy your plugin becomes!**

## Real Example

**See a complete working example at `packages/plugin-example/tests/addition.spec.ts`**

This example demonstrates:

- Using `@dkg/plugins/testing` helpers
- Proper MCP server/client testing with real SDK components
- Mock DKG context with blob storage
- Comprehensive tool registration and functionality testing
- Error handling for both MCP tools and API endpoints

## Manual Setup (Only if NOT using the generator)

If you didn't use `turbo gen` (plugin option) and need to set up testing manually:

<details>
<summary>Click to expand manual setup instructions</summary>

### 1. Add Test Script

Add to your `package.json`:

```json
{
  "scripts": {
    "test": "mocha 'tests/**/*.spec.ts'"
  }
}
```

### 2. Create Test File

Create `tests/your-plugin.spec.ts` and copy the template from any existing plugin test file.

### 3. Install Testing Dependencies

Add the testing helpers to your plugin's dependencies:

```json
{
  "devDependencies": {
    "@dkg/plugins": "*"
  }
}
```

**Import testing helpers:**

```typescript
import {
  createExpressApp,
  createInMemoryBlobStorage,
  createMcpServerClientPair,
  createMockDkgClient,
} from "@dkg/plugins/testing";
```

</details>

## Quick Checklist

Before submitting your plugin, check that you have:

**Automatic Setup (if you used `turbo gen` plugin option):**

- [ ] Ran `npm install` in root directory after plugin creation
- [ ] Test script exists in `package.json`
- [ ] Test file exists in `tests/` directory
- [ ] Plugin Configuration tests work automatically
- [ ] Mock infrastructure is set up with new `@dkg/plugins/testing` helpers
- [ ] MCP server/client pair is properly configured with in-memory transport
- [ ] Mock DKG context includes blob storage support

**Required Customization:**

- [ ] Replaced placeholder **Core Functionality** tests with real tests
- [ ] Replaced placeholder **Error Handling** tests with real tests

**Optional Enhancements:**

- [ ] Added Edge Cases tests
- [ ] Added Performance tests
- [ ] Added Integration tests
- [ ] Added Security tests
- [ ] Added Blob Storage tests (if your plugin handles file uploads/downloads)

**Technical Requirements (GitHub Actions validates these):**

- [ ] All tests pass: `npm test`
- [ ] Tests run under 60 seconds
- [ ] Core functionality tests exist
- [ ] Error handling tests exist

If all boxes are checked, your plugin is ready for submission!

**Automated Validation**: GitHub Actions will automatically run your tests and check that Core Functionality and Error Handling tests exist when you submit a PR. If tests fail (including placeholder tests that weren't customized) or required tests are missing, GitHub Actions will FAIL, but you can still merge unless branch protection rules are enabled.
