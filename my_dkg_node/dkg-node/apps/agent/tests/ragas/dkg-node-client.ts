/**
 * DKG Node Web Client for RAGAS Evaluation
 * Uses Playwright to interact with DKG Node web interface like existing E2E tests
 */

import { chromium, Browser, Page } from "playwright";

export interface DkgNodeWebConfig {
  baseUrl: string;
  timeout?: number;
  maxRetries?: number;
  auth?: {
    email: string;
    password: string;
  };
}

export class DkgNodeWebClient {
  private config: DkgNodeWebConfig;
  private browser: Browser | null = null;
  private page: Page | null = null;

  constructor(config: DkgNodeWebConfig) {
    this.config = {
      timeout: 2 * 60 * 1000, // 2 minutes per question (same as E2E actionTimeout)
      maxRetries: 3,
      auth: {
        email: "admin@gmail.com",
        password: "admin123",
      },
      ...config,
    };
  }

  async initialize(): Promise<void> {
    console.log("🌐 Starting browser for DKG Node web interface...");

    try {
      // Always run in headless mode
      console.log("🔧 Browser mode: headless");

      this.browser = await chromium.launch({
        headless: true,
        slowMo: 1000,
        args: ["--window-size=1920,1080"],
      });

      this.page = await this.browser.newPage({
        viewport: { width: 1920, height: 1080 },
      });

      // Go to website
      await this.page.goto(this.config.baseUrl + "/login");

      // Wait for page to load
      await this.page.waitForLoadState("domcontentloaded");

      // Wait for logo to ensure page loaded properly
      await this.page.getByTestId("header-logo").waitFor({
        timeout: 2 * 60 * 1000,
      });

      // Wait for login form
      await this.page.getByTestId("login-email-input").waitFor({
        timeout: 2 * 60 * 1000,
      });

      // Login
      await this.login();

      console.log("✅ Successfully connected to DKG Node web interface");
    } catch (error) {
      console.error("❌ Failed to initialize web interface:", error);
      await this.close();
      throw error;
    }
  }

  // Helper function to wait for element to be stable (visible for at least 2 seconds)
  private async waitForStableElement(
    locator: any,
    timeout = 30000,
  ): Promise<void> {
    const stableTime = 2000; // 2 seconds
    const checkInterval = 100; // Check every 100ms
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        // Check if element is visible
        await locator.waitFor({ state: "visible", timeout: 1000 });

        // Element is visible, now wait for it to remain stable
        let stableStart = Date.now();
        let isStable = true;

        while (Date.now() - stableStart < stableTime) {
          try {
            // Check if element is still visible
            await locator.waitFor({ state: "visible", timeout: checkInterval });
            await this.page!.waitForTimeout(checkInterval);
          } catch (error) {
            // Element disappeared, restart stability check
            isStable = false;
            break;
          }
        }

        if (isStable) {
          // Element has been stable for 2 seconds
          return;
        }

        // Element wasn't stable, wait a bit and try again
        await this.page!.waitForTimeout(500);
      } catch (error) {
        // Element not visible yet, wait and retry
        await this.page!.waitForTimeout(500);
      }
    }

    throw new Error(`Element did not become stable within ${timeout}ms`);
  }

  private async login(): Promise<void> {
    if (!this.page) {
      throw new Error("Page not initialized");
    }

    console.log("🔐 Logging into DKG Node web interface...");

    try {
      // Wait for email input to be stable (password and login button will be loaded too)
      await this.waitForStableElement(
        this.page.getByTestId("login-email-input"),
      );
      await this.page
        .getByTestId("login-email-input")
        .fill(this.config.auth!.email);
      await this.page
        .getByTestId("login-password-input")
        .fill(this.config.auth!.password);
      await this.page.getByTestId("login-submit-button").click();

      // Wait for successful login (chat input appears and is stable)
      console.log("⏳ Waiting for login to complete...");
      await this.waitForStableElement(
        this.page.getByTestId("chat-input"),
        2 * 60 * 1000,
      );

      console.log("✅ Successfully logged in");
    } catch (error) {
      console.error("❌ Login failed:", error);
      throw error;
    }
  }

  async askQuestion(question: string): Promise<string> {
    if (!this.page) {
      throw new Error("Browser not initialized");
    }

    console.log(`\n🤖 Asking DKG Node: "${question}"`);

    try {
      // Fill chat input using getByTestId
      await this.page.getByTestId("chat-input").fill(question);
      await this.page.getByTestId("chat-input").press("Enter");

      // Handle tool permission dialog if it appears
      try {
        await this.page.getByTestId("tool-allow-session-checkbox").waitFor({
          timeout: 5000,
        });
        await this.page.getByTestId("tool-allow-session-checkbox").click();
        await this.page.getByTestId("tool-continue-button").click({
          timeout: 2000,
        });
      } catch (e) {
        // Tool permission dialog might not appear, that's fine
        console.log(
          "📝 No tool permission dialog (normal for simple questions)",
        );
      }

      // Wait for DKG Node to finish processing using the same logic as E2E tests
      console.log("⏳ Waiting for DKG Node to finish processing...");
      await this.page.waitForFunction(
        (question) => {
          const messages = Array.from(
            document.querySelectorAll('[data-testid="chat-message-text"]'),
          );
          if (messages.length === 0) return false;

          const lastMessage = messages[messages.length - 1];
          const text = lastMessage?.textContent || "";

          // Check if the last message is not a "Thinking" variation AND not the same as the question
          const isNotThinking = !text.trim().startsWith("Thinking");
          const isNotSameAsQuestion = text.trim() !== question.trim();
          const hasContent = text.length > 0;

          return hasContent && isNotThinking && isNotSameAsQuestion;
        },
        question,
        { timeout: 300000 }, // 5 minutes for DKG operations (same as E2E tests)
      );

      // Get the final response
      const responseElements = await this.page
        .getByTestId("chat-message-text")
        .all();
      const lastResponse =
        await responseElements[responseElements.length - 1]?.textContent();

      if (!lastResponse) {
        throw new Error("No response received from DKG Node");
      }

      const finalResponse = lastResponse.trim();

      if (!finalResponse) {
        throw new Error(
          "No valid response received from DKG Node after waiting",
        );
      }
      console.log(
        `✅ Got response from DKG Node (${finalResponse.length} chars)`,
      );
      console.log(`📝 DKG Answer: "${finalResponse}"`);

      // Click "Start again" to reset the chat for next question
      try {
        console.log('🔄 Clicking "Start again" to reset chat...');
        await this.page.getByTestId("start-again-button").click({
          timeout: 5000,
        });
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for reset
        console.log("✅ Chat reset successfully");
      } catch (e) {
        console.log(
          '⚠️ "Start again" button not found - continuing without reset',
        );
      }

      return finalResponse;
    } catch (error) {
      console.error(`❌ Error asking question: ${error}`);
      throw error;
    }
  }

  async askMultipleQuestions(questions: string[]): Promise<string[]> {
    console.log(
      `🔄 Processing ${questions.length} questions through DKG Node web interface...`,
    );

    const answers: string[] = [];

    // Process questions sequentially to avoid overwhelming the UI
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];

      if (!question) {
        console.error(`❌ Question ${i + 1} is undefined, skipping`);
        answers.push("Error: Question is undefined");
        continue;
      }

      try {
        console.log(`\n📝 Processing question ${i + 1}/${questions.length}`);
        const answer = await this.askQuestion(question);
        answers.push(answer);

        // Small delay between questions to be respectful to the UI
        if (i < questions.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error(`❌ Question ${i + 1} failed:`, error);
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        answers.push(`Error: ${errorMessage}`);

        // Continue with next question even if one fails
        continue;
      }
    }

    console.log(`✅ Completed processing ${questions.length} questions`);

    // Summary log of all Q&A pairs
    console.log(`\n📋 SUMMARY OF ALL DKG NODE ANSWERS:`);
    console.log(`${"=".repeat(80)}`);
    for (let i = 0; i < questions.length; i++) {
      console.log(`\n${i + 1}. Q: ${questions[i]}`);
      console.log(`   A: ${answers[i]}`);
    }
    console.log(`${"=".repeat(80)}`);

    return answers;
  }

  async close(): Promise<void> {
    console.log("🔌 Closing browser...");

    if (this.page) {
      await this.page.close();
      this.page = null;
    }

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

// Default configuration for DKG Node web interface
export const defaultDkgNodeWebConfig: DkgNodeWebConfig = {
  baseUrl: "http://localhost:8081",
  timeout: 2 * 60 * 1000, // 2 minutes per question
  maxRetries: 3,
  auth: {
    email: "admin@gmail.com",
    password: "admin123",
  },
};
