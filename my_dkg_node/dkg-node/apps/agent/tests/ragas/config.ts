import * as path from "path";

export interface RagasConfig {
  // LLM Configuration
  llmModel: string;

  // Evaluation Settings
  metrics: string[];
  batchSize: number;
  maxRetries: number;

  // Output Settings
  outputDir: string;
  reportFormat: "json" | "csv" | "html";

  // DKG Node Configuration
  dkgNodeUrl: string;
  mcpUrl: string;

  // Custom Thresholds
  thresholds: {
    context_precision: number;
    context_recall: number;
    context_relevancy: number;
    answer_relevance: number;
    faithfulness: number;
    answer_similarity: number;
    answer_correctness: number;
  };
}

export const defaultRagasConfig: RagasConfig = {
  llmModel: "gpt-4",

  metrics: [
    "context_precision",
    "context_recall",
    "context_relevancy",
    "answer_relevance",
    "faithfulness",
    "answer_similarity",
    "answer_correctness",
  ],

  batchSize: 5,
  maxRetries: 3,

  outputDir: path.resolve(__dirname, "../../../../tests/ragas/reports"), // Absolute path to project root tests
  reportFormat: "json",

  // DKG Node local URLs
  dkgNodeUrl: "http://localhost:9200",
  mcpUrl: "http://localhost:9200/mcp",

  thresholds: {
    context_precision: 0.8,
    context_recall: 0.8,
    context_relevancy: 0.8,
    answer_relevance: 0.8,
    faithfulness: 0.8,
    answer_similarity: 0.8,
    answer_correctness: 0.8,
  },
};

export const defaultDkgNodeMcpConfig = {
  baseUrl: "http://localhost:9200",
  mcpEndpoint: "/mcp",
  timeout: 30000,
  maxRetries: 3,
};
