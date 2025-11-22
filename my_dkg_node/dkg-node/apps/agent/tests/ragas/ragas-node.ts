/**
 * Node.js compatible RAGAS implementation
 * This provides RAGAS-like functionality for evaluating RAG systems in Node.js/TypeScript
 */

import { defaultLLMClient } from "./llm-client";

export interface RagasDataset {
  question: string[];
  answer: string[];
  contexts: string[][];
  ground_truths: string[][];
}

export interface RagasMetric {
  name: string;
  description: string;
  evaluate: (data: {
    question: string;
    answer: string;
    contexts: string[];
  }) => Promise<number>;
}

export interface RagasEvaluationResult {
  [metricName: string]: number;
}

export interface RagasEvaluationOptions {
  maxConcurrency?: number;
  maxRetries?: number;
  batchSize?: number;
}

/**
 * Base class for RAGAS metrics
 */
export class Metric implements RagasMetric {
  name: string;
  description: string;

  constructor(config: {
    name: string;
    description: string;
    evaluate: (data: any) => Promise<number>;
  }) {
    this.name = config.name;
    this.description = config.description;
    this.evaluate = config.evaluate;
  }

  async evaluate(data: {
    question: string;
    answer: string;
    contexts: string[];
  }): Promise<number> {
    throw new Error("Evaluate method must be implemented by subclass");
  }
}

/**
 * Context Precision Metric
 * Measures the precision of the retrieved context
 */
export const contextPrecision = new Metric({
  name: "context_precision",
  description:
    "Measures the precision of retrieved context relevance to the question",

  async evaluate({
    question,
    answer,
    contexts,
  }: {
    question: string;
    answer: string;
    contexts: string[];
  }) {
    if (!contexts || contexts.length === 0) return 0;

    const prompt = `
You are evaluating the precision of retrieved context for a question-answering system.

Question: ${question}
Answer: ${answer}
Retrieved Contexts: ${contexts.join("\n\n")}

Rate how precise the retrieved contexts are on a scale of 0-1:
- 1.0: All retrieved contexts are highly relevant to answering the question
- 0.8: Most contexts are relevant with minimal irrelevant information
- 0.6: Some contexts are relevant but there's noticeable irrelevant content
- 0.4: Few contexts are relevant, mostly irrelevant information
- 0.2: Very little relevant context retrieved
- 0.0: No relevant context retrieved

Consider:
1. How much of the retrieved context directly helps answer the question
2. The ratio of relevant to irrelevant information
3. Whether the contexts contain the necessary information

Respond with only a number between 0 and 1 (e.g., 0.85).
`;

    try {
      const response = await defaultLLMClient.evaluate(prompt);
      const score = parseFloat(response.content.trim());
      return isNaN(score) ? 0 : Math.max(0, Math.min(1, score));
    } catch (error) {
      console.error("Context precision evaluation failed:", error);
      return 0;
    }
  },
});

/**
 * Context Recall Metric
 * Measures the recall of the retrieved context
 */
export const contextRecall = new Metric({
  name: "context_recall",
  description: "Measures how much of the necessary context was retrieved",

  async evaluate({
    question,
    answer,
    contexts,
  }: {
    question: string;
    answer: string;
    contexts: string[];
  }) {
    if (!contexts || contexts.length === 0) return 0;

    const prompt = `
You are evaluating the recall of retrieved context for a question-answering system.

Question: ${question}
Answer: ${answer}
Retrieved Contexts: ${contexts.join("\n\n")}

Rate how complete the retrieved contexts are on a scale of 0-1:
- 1.0: All necessary information to answer the question is present
- 0.8: Most necessary information is present, minor gaps
- 0.6: Some key information is present but notable gaps exist
- 0.4: Limited necessary information, significant gaps
- 0.2: Very little necessary information retrieved
- 0.0: No necessary information retrieved

Consider:
1. Whether all key facts needed to answer the question are present
2. If any critical information is missing from the contexts
3. The completeness of information coverage

Respond with only a number between 0 and 1 (e.g., 0.75).
`;

    try {
      const response = await defaultLLMClient.evaluate(prompt);
      const score = parseFloat(response.content.trim());
      return isNaN(score) ? 0 : Math.max(0, Math.min(1, score));
    } catch (error) {
      console.error("Context recall evaluation failed:", error);
      return 0;
    }
  },
});

/**
 * Context Relevancy Metric
 * Measures how relevant the retrieved context is to the question
 */
export const contextRelevancy = new Metric({
  name: "context_relevancy",
  description: "Measures the relevancy of retrieved context to the question",

  async evaluate({
    question,
    contexts,
  }: {
    question: string;
    answer: string;
    contexts: string[];
  }) {
    if (!contexts || contexts.length === 0) return 0;

    const prompt = `
You are evaluating the relevancy of retrieved context to a question.

Question: ${question}
Retrieved Contexts: ${contexts.join("\n\n")}

Rate how relevant the contexts are to the question on a scale of 0-1:
- 1.0: All contexts are directly relevant to the question
- 0.8: Most contexts are relevant with good topical alignment
- 0.6: Some contexts are relevant, others are tangentially related
- 0.4: Few contexts are relevant, many are off-topic
- 0.2: Very few contexts are relevant to the question
- 0.0: No contexts are relevant to the question

Consider:
1. Topical alignment between contexts and question
2. Whether contexts contain information that helps answer the question
3. The overall relevance of the information provided

Respond with only a number between 0 and 1 (e.g., 0.90).
`;

    try {
      const response = await defaultLLMClient.evaluate(prompt);
      const score = parseFloat(response.content.trim());
      return isNaN(score) ? 0 : Math.max(0, Math.min(1, score));
    } catch (error) {
      console.error("Context relevancy evaluation failed:", error);
      return 0;
    }
  },
});

/**
 * Answer Relevance Metric
 * Measures how relevant the answer is to the question
 */
export const answerRelevance = new Metric({
  name: "answer_relevance",
  description: "Measures how relevant the generated answer is to the question",

  async evaluate({
    question,
    answer,
  }: {
    question: string;
    answer: string;
    contexts: string[];
  }) {
    const prompt = `
You are evaluating the relevance of an answer to a question.

Question: ${question}
Answer: ${answer}

Rate how relevant the answer is to the question on a scale of 0-1:
- 1.0: Answer directly and completely addresses the question
- 0.8: Answer mostly addresses the question with good relevance
- 0.6: Answer partially addresses the question, some relevance
- 0.4: Answer somewhat addresses the question, limited relevance
- 0.2: Answer barely addresses the question, poor relevance
- 0.0: Answer does not address the question at all

Consider:
1. Whether the answer directly responds to what was asked
2. If the answer stays on topic
3. How well the answer fulfills the question's intent

Respond with only a number between 0 and 1 (e.g., 0.92).
`;

    try {
      const response = await defaultLLMClient.evaluate(prompt);
      const score = parseFloat(response.content.trim());
      return isNaN(score) ? 0 : Math.max(0, Math.min(1, score));
    } catch (error) {
      console.error("Answer relevance evaluation failed:", error);
      return 0;
    }
  },
});

/**
 * Faithfulness Metric
 * Measures how faithful the answer is to the retrieved context
 */
export const faithfulness = new Metric({
  name: "faithfulness",
  description:
    "Measures how faithful the generated answer is to the retrieved context",

  async evaluate({
    answer,
    contexts,
  }: {
    question: string;
    answer: string;
    contexts: string[];
  }) {
    if (!contexts || contexts.length === 0) return 0;

    const prompt = `
You are evaluating the faithfulness of an answer to its source contexts.

Answer: ${answer}
Source Contexts: ${contexts.join("\n\n")}

Rate how faithful the answer is to the source contexts on a scale of 0-1:
- 1.0: Answer is completely supported by and grounded in the contexts
- 0.8: Answer is mostly supported by contexts with minimal unsupported claims
- 0.6: Answer is somewhat supported but contains some unsupported information
- 0.4: Answer is partially supported but has notable unsupported claims
- 0.2: Answer is poorly supported by contexts, mostly unsupported
- 0.0: Answer contradicts or is not supported by contexts at all

Consider:
1. Whether all claims in the answer can be traced back to the contexts
2. If the answer introduces information not present in contexts
3. Whether the answer contradicts any information in the contexts

Respond with only a number between 0 and 1 (e.g., 0.88).
`;

    try {
      const response = await defaultLLMClient.evaluate(prompt);
      const score = parseFloat(response.content.trim());
      return isNaN(score) ? 0 : Math.max(0, Math.min(1, score));
    } catch (error) {
      console.error("Faithfulness evaluation failed:", error);
      return 0;
    }
  },
});

/**
 * Answer Similarity Metric
 * Measures similarity between generated answer and ground truth
 */
export const answerSimilarity = new Metric({
  name: "answer_similarity",
  description:
    "Measures semantic similarity between generated answer and ground truth",

  async evaluate({
    answer,
    question,
    contexts,
  }: {
    question: string;
    answer: string;
    contexts: string[];
  }) {
    // For this metric, we need ground truth, which should be passed separately
    // This is a simplified version that evaluates answer quality
    const prompt = `
You are evaluating the quality and completeness of an answer.

Question: ${question}
Answer: ${answer}
Context: ${contexts.join(" ")}

Rate the answer quality on a scale of 0-1:
- 1.0: Excellent answer, comprehensive and accurate
- 0.8: Good answer, mostly complete and accurate
- 0.6: Adequate answer, covers main points but lacks detail
- 0.4: Basic answer, covers some points but incomplete
- 0.2: Poor answer, minimal coverage of the question
- 0.0: Very poor answer, does not adequately respond

Consider:
1. Accuracy of information provided
2. Completeness of the response
3. Clarity and coherence
4. Appropriate level of detail

Respond with only a number between 0 and 1 (e.g., 0.76).
`;

    try {
      const response = await defaultLLMClient.evaluate(prompt);
      const score = parseFloat(response.content.trim());
      return isNaN(score) ? 0 : Math.max(0, Math.min(1, score));
    } catch (error) {
      console.error("Answer similarity evaluation failed:", error);
      return 0;
    }
  },
});

/**
 * Answer Correctness Metric
 * Measures the correctness of the generated answer
 */
export const answerCorrectness = new Metric({
  name: "answer_correctness",
  description: "Measures the factual correctness of the generated answer",

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
You are evaluating the factual correctness of an answer.

Question: ${question}
Answer: ${answer}
Context: ${contexts.join(" ")}

Rate the factual correctness of the answer on a scale of 0-1:
- 1.0: All facts in the answer are correct and accurate
- 0.8: Most facts are correct with minor inaccuracies
- 0.6: Generally correct but some notable factual errors
- 0.4: Some correct facts but several significant errors
- 0.2: Few correct facts, mostly inaccurate information
- 0.0: Factually incorrect or misleading information

Consider:
1. Whether the facts stated are accurate
2. If there are any factual errors or misstatements
3. Whether the answer contains misleading information
4. Consistency with reliable information

Respond with only a number between 0 and 1 (e.g., 0.94).
`;

    try {
      const response = await defaultLLMClient.evaluate(prompt);
      const score = parseFloat(response.content.trim());
      return isNaN(score) ? 0 : Math.max(0, Math.min(1, score));
    } catch (error) {
      console.error("Answer correctness evaluation failed:", error);
      return 0;
    }
  },
});

// Default metrics available for evaluation
export const defaultMetrics = [
  contextPrecision,
  contextRecall,
  contextRelevancy,
  answerRelevance,
  faithfulness,
  answerSimilarity,
  answerCorrectness,
];

/**
 * Main evaluation function
 */
export async function evaluate(
  dataset: RagasDataset,
  metrics: RagasMetric[] = defaultMetrics,
  options: RagasEvaluationOptions = {},
): Promise<RagasEvaluationResult> {
  const { maxConcurrency = 3, maxRetries = 2 } = options;

  console.log(
    `🔍 Evaluating ${dataset.question.length} samples with ${metrics.length} metrics...`,
  );

  const results: RagasEvaluationResult = {};

  // Initialize results for each metric
  for (const metric of metrics) {
    results[metric.name] = 0;
  }

  // Process each sample
  for (let i = 0; i < dataset.question.length; i++) {
    const sample = {
      question: dataset.question[i] || "",
      answer: dataset.answer[i] || "",
      contexts: dataset.contexts[i] || [],
    };

    console.log(`📊 Evaluating sample ${i + 1}/${dataset.question.length}...`);

    // Evaluate each metric for this sample
    for (const metric of metrics) {
      try {
        const score = await metric.evaluate(sample);
        if (typeof results[metric.name] === "number") {
          results[metric.name] = (results[metric.name] || 0) + score;
        }
      } catch (error) {
        console.error(
          `❌ Error evaluating ${metric.name} for sample ${i + 1}:`,
          error,
        );
        // Continue with 0 score for this metric on this sample
      }
    }

    // Small delay between samples to avoid rate limiting
    if (i < dataset.question.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  // Calculate average scores
  const sampleCount = dataset.question.length;
  for (const metricName in results) {
    if (results[metricName] !== undefined && sampleCount > 0) {
      results[metricName] = results[metricName] / sampleCount;
    }
  }

  console.log(`✅ Evaluation completed for ${sampleCount} samples`);
  return results;
}
