/**
 * LLM Client for RAGAS Evaluation
 * Handles LLM API calls for evaluation metrics
 */

// Load environment variables before anything else
import dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.join(__dirname, "../../.env") });
dotenv.config({ path: path.join(__dirname, "../../.env.development.local") });

export interface LLMResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface LLMClient {
  evaluate(prompt: string): Promise<LLMResponse>;
}

export class OpenAILLMClient implements LLMClient {
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(apiKey?: string, model: string = "gpt-4o-mini") {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || "";
    this.model = model;
    this.baseUrl = "https://api.openai.com/v1";

    if (!this.apiKey) {
      console.warn(
        "⚠️  OpenAI API key not provided. RAGAS evaluation will not work without a valid API key.",
      );
      console.warn(
        "💡 Set OPENAI_API_KEY environment variable to enable LLM-based evaluation.",
      );
    }
  }

  async evaluate(prompt: string): Promise<LLMResponse> {
    if (!this.apiKey) {
      throw new Error(
        "OpenAI API key is required for evaluation. Set OPENAI_API_KEY environment variable.",
      );
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: "system",
              content:
                "You are a helpful AI assistant that provides accurate and concise responses for evaluation purposes.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.1,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `OpenAI API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`OpenAI API error: ${data.error.message}`);
      }

      return {
        content: data.choices[0]?.message?.content || "",
        usage: data.usage,
      };
    } catch (error) {
      console.error("OpenAI API call failed:", error);
      throw error;
    }
  }
}

// Default LLM client instance - create after environment is loaded
export const defaultLLMClient = new OpenAILLMClient();
