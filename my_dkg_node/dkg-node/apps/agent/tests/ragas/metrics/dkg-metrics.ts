import { Metric } from "../ragas-node";
import { defaultLLMClient } from "../llm-client";

/**
 * Custom metric for evaluating DKG asset operation accuracy
 * Measures how accurately the system explains DKG blockchain operations
 */
export const dkgAssetAccuracy = new Metric({
  name: "dkg_asset_accuracy",
  description:
    "Measures accuracy of DKG asset operation recommendations and explanations",

  async evaluate({
    question,
    answer,
    contexts,
  }: {
    question: string;
    answer: string;
    contexts: string[];
  }) {
    const prompt = `
You are evaluating a DKG Node response about blockchain asset operations.

Question: ${question}
Answer: ${answer}
Context: ${contexts.join(" ")}

Rate the accuracy of the answer on a scale of 0-1 based on:
1. Technical accuracy of DKG asset operation explanations
2. Correctness of UAL (Unique Asset Locator) descriptions
3. Accuracy of blockchain integration explanations
4. Proper explanation of asset publishing workflows

Respond with only a number between 0 and 1 (e.g., 0.85).
`;

    try {
      const response = await defaultLLMClient.evaluate(prompt);
      const score = parseFloat(response.content.trim());
      return isNaN(score) ? 0 : Math.max(0, Math.min(1, score));
    } catch (error) {
      console.error("DKG Asset accuracy evaluation failed:", error);
      return 0;
    }
  },
});

/**
 * Custom metric for evaluating blockchain integration precision
 * Measures how precisely the system explains blockchain technology integration
 */
export const blockchainIntegrationPrecision = new Metric({
  name: "blockchain_integration_precision",
  description:
    "Measures precision of blockchain integration explanations and technical details",

  async evaluate({
    question,
    answer,
    contexts,
  }: {
    question: string;
    answer: string;
    contexts: string[];
  }) {
    const prompt = `
You are evaluating a DKG Node response about blockchain integration concepts.

Question: ${question}
Answer: ${answer}
Context: ${contexts.join(" ")}

Rate the precision of the answer on a scale of 0-1 based on:
1. Accuracy of blockchain network explanations (OTP, Ethereum, Polygon)
2. Correctness of TRAC token usage descriptions
3. Precision of consensus mechanism explanations
4. Accurate description of transaction processes

Respond with only a number between 0 and 1 (e.g., 0.92).
`;

    try {
      const response = await defaultLLMClient.evaluate(prompt);
      const score = parseFloat(response.content.trim());
      return isNaN(score) ? 0 : Math.max(0, Math.min(1, score));
    } catch (error) {
      console.error(
        "Blockchain integration precision evaluation failed:",
        error,
      );
      return 0;
    }
  },
});

/**
 * Custom metric for evaluating knowledge graph accuracy
 * Measures how accurately the system explains knowledge graph concepts
 */
export const knowledgeGraphAccuracy = new Metric({
  name: "knowledge_graph_accuracy",
  description:
    "Measures accuracy of knowledge graph concept explanations and operations",

  async evaluate({
    question,
    answer,
    contexts,
  }: {
    question: string;
    answer: string;
    contexts: string[];
  }) {
    const prompt = `
You are evaluating a DKG Node response about knowledge graph concepts.

Question: ${question}
Answer: ${answer}
Context: ${contexts.join(" ")}

Rate the accuracy of the answer on a scale of 0-1 based on:
1. Correctness of knowledge graph structure explanations
2. Accuracy of semantic web standards descriptions (JSON-LD, RDF)
3. Proper explanation of linked data concepts
4. Accurate description of graph traversal and querying

Respond with only a number between 0 and 1 (e.g., 0.78).
`;

    try {
      const response = await defaultLLMClient.evaluate(prompt);
      const score = parseFloat(response.content.trim());
      return isNaN(score) ? 0 : Math.max(0, Math.min(1, score));
    } catch (error) {
      console.error("Knowledge graph accuracy evaluation failed:", error);
      return 0;
    }
  },
});

/**
 * Custom metric for evaluating technical clarity
 * Measures how clearly technical concepts are explained to users
 */
export const technicalClarity = new Metric({
  name: "technical_clarity",
  description: "Measures clarity and accessibility of technical explanations",

  async evaluate({
    question,
    answer,
    contexts,
  }: {
    question: string;
    answer: string;
    contexts: string[];
  }) {
    const prompt = `
You are evaluating the clarity of a technical explanation.

Question: ${question}
Answer: ${answer}
Context: ${contexts.join(" ")}

Rate the clarity of the technical explanation on a scale of 0-1 based on:
1. Use of clear, understandable language
2. Appropriate level of technical detail for the question
3. Logical structure and flow of explanation
4. Absence of unnecessary jargon or complexity

Respond with only a number between 0 and 1 (e.g., 0.88).
`;

    try {
      const response = await defaultLLMClient.evaluate(prompt);
      const score = parseFloat(response.content.trim());
      return isNaN(score) ? 0 : Math.max(0, Math.min(1, score));
    } catch (error) {
      console.error("Technical clarity evaluation failed:", error);
      return 0;
    }
  },
});

/**
 * Custom metric for evaluating MCP tool accuracy
 * Measures how accurately MCP (Model Context Protocol) tools are explained
 */
export const mcpToolAccuracy = new Metric({
  name: "mcp_tool_accuracy",
  description:
    "Measures accuracy of MCP tool explanations and usage instructions",

  async evaluate({
    question,
    answer,
    contexts,
  }: {
    question: string;
    answer: string;
    contexts: string[];
  }) {
    const prompt = `
You are evaluating a DKG Node response about MCP (Model Context Protocol) tools.

Question: ${question}
Answer: ${answer}
Context: ${contexts.join(" ")}

Rate the accuracy of the MCP explanation on a scale of 0-1 based on:
1. Correctness of MCP protocol descriptions
2. Accuracy of tool registration and usage explanations
3. Proper description of AI agent integration
4. Accurate explanation of MCP server/client interactions

Respond with only a number between 0 and 1 (e.g., 0.83).
`;

    try {
      const response = await defaultLLMClient.evaluate(prompt);
      const score = parseFloat(response.content.trim());
      return isNaN(score) ? 0 : Math.max(0, Math.min(1, score));
    } catch (error) {
      console.error("MCP tool accuracy evaluation failed:", error);
      return 0;
    }
  },
});

/**
 * Custom metric for evaluating plugin system accuracy
 * Measures how accurately the plugin system and extensibility are explained
 */
export const pluginSystemAccuracy = new Metric({
  name: "plugin_system_accuracy",
  description:
    "Measures accuracy of plugin system explanations and development guidance",

  async evaluate({
    question,
    answer,
    contexts,
  }: {
    question: string;
    answer: string;
    contexts: string[];
  }) {
    const prompt = `
You are evaluating a DKG Node response about the plugin system and extensibility.

Question: ${question}
Answer: ${answer}
Context: ${contexts.join(" ")}

Rate the accuracy of the plugin system explanation on a scale of 0-1 based on:
1. Correctness of plugin architecture descriptions
2. Accuracy of plugin development instructions
3. Proper explanation of plugin integration methods
4. Accurate description of available plugin types and capabilities

Respond with only a number between 0 and 1 (e.g., 0.79).
`;

    try {
      const response = await defaultLLMClient.evaluate(prompt);
      const score = parseFloat(response.content.trim());
      return isNaN(score) ? 0 : Math.max(0, Math.min(1, score));
    } catch (error) {
      console.error("Plugin system accuracy evaluation failed:", error);
      return 0;
    }
  },
});

// Export all DKG-specific metrics
export const dkgCustomMetrics = [
  dkgAssetAccuracy,
  blockchainIntegrationPrecision,
  knowledgeGraphAccuracy,
  technicalClarity,
  mcpToolAccuracy,
  pluginSystemAccuracy,
];
