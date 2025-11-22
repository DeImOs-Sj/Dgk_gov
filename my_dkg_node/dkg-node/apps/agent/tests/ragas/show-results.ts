#!/usr/bin/env tsx

import * as fs from "fs";
import * as path from "path";

// Load environment variables (same as DKG Node does)
import dotenv from "dotenv";
dotenv.config({ path: path.join(__dirname, "../../.env") });
dotenv.config({ path: path.join(__dirname, "../../.env.development.local") });

interface EvaluationReport {
  timestamp: string;
  scores: Record<string, number>;
  summary: {
    overall: {
      averageScore: number;
      passRate: number;
    };
    byMetric: Record<
      string,
      {
        score: number;
        threshold: number;
        passed: boolean;
        status: string;
      }
    >;
    passed: number;
    failed: number;
    total: number;
  };
  recommendations: string[];
  detailedResults?: any;
}

function findLatestReport(): string | null {
  // Reports are in the same directory structure
  const reportsDir = path.join(__dirname, "reports");

  if (!fs.existsSync(reportsDir)) {
    console.log("📁 No reports directory found");
    return null;
  }

  const reportDirs = fs
    .readdirSync(reportsDir)
    .filter((dir) => dir.startsWith("evaluation-"))
    .sort()
    .reverse();

  if (reportDirs.length === 0) {
    console.log("📁 No evaluation reports found");
    return null;
  }

  const latestDir = reportDirs[0];
  if (!latestDir) {
    console.log("📁 No valid evaluation directories found");
    return null;
  }

  const reportPath = path.join(reportsDir, latestDir, "evaluation-report.json");

  if (!fs.existsSync(reportPath)) {
    console.log("📁 Latest report directory exists but no JSON report found");
    return null;
  }

  return reportPath;
}

function loadReport(reportPath: string): EvaluationReport {
  try {
    const reportContent = fs.readFileSync(reportPath, "utf-8");
    return JSON.parse(reportContent);
  } catch (error) {
    throw new Error(`Failed to load report: ${error}`);
  }
}

function formatScore(score: number): string {
  return `${(score * 100).toFixed(1)}%`;
}

function getStatusEmoji(passed: boolean): string {
  return passed ? "✅" : "❌";
}

function getScoreColor(score: number, threshold: number): string {
  if (score >= threshold) return "\x1b[32m"; // Green
  if (score >= threshold * 0.8) return "\x1b[33m"; // Yellow
  return "\x1b[31m"; // Red
}

function resetColor(): string {
  return "\x1b[0m";
}

export function displayReport(report: EvaluationReport): void {
  console.log("🎯 DKG NODE RAGAS EVALUATION RESULTS");
  console.log("══════════════════════════════════════════════════");

  // Timestamp
  const reportTime = new Date(report.timestamp);
  console.log(`📅 Timestamp: ${reportTime.toLocaleString()}`);

  // Overall Score with color
  const overallScorePercent = Math.round(
    report.summary.overall.averageScore * 100,
  );
  const overallScoreColor =
    overallScorePercent >= 80 ? "🟢" : overallScorePercent >= 60 ? "🟡" : "🔴";
  console.log(`📊 Overall Score: ${overallScoreColor} ${overallScorePercent}%`);

  // Pass Rate
  const passRatePercent = Math.round(report.summary.overall.passRate * 100);
  console.log(
    `🎯 Pass Rate: ${passRatePercent}% (${report.summary.passed}/${report.summary.total} metrics passed)`,
  );
  console.log("");

  // Detailed Metrics
  console.log("📈 DETAILED METRICS:");
  console.log("──────────────────────────────────────────────────");

  const metrics = Object.entries(report.summary.byMetric);

  // Define metric order and emojis to match Guardian
  const metricConfig = {
    context_relevancy: { emoji: "🎯", label: "Context Relevancy" },
    context_precision: { emoji: "🎯", label: "Context Precision" },
    context_recall: { emoji: "🎯", label: "Context Recall" },
    answer_relevance: { emoji: "💬", label: "Answer Relevance" },
    answer_correctness: { emoji: "✅", label: "Answer Correctness" },
    answer_similarity: { emoji: "🔄", label: "Answer Similarity" },
    faithfulness: { emoji: "🤝", label: "Faithfulness" },
  };

  // Sort metrics to match Guardian order
  const sortedMetrics = metrics.sort(([a], [b]) => {
    const order = Object.keys(metricConfig);
    return order.indexOf(a) - order.indexOf(b);
  });

  sortedMetrics.forEach(([metricName, data]) => {
    const config = metricConfig[metricName as keyof typeof metricConfig];
    const emoji = config?.emoji || "📊";
    const label = config?.label || metricName.replace(/_/g, " ");
    const scorePercent = Math.round(data.score * 100);
    const scoreColor = data.passed ? "🟢" : "🔴";
    const status = data.passed ? "✅ PASS" : "❌ FAIL";

    // Format to match Guardian exactly: emoji + label + spaces + color + score + spaces + status
    const labelPadded = label.padEnd(20);
    console.log(
      `${emoji} ${labelPadded}${scoreColor} ${scorePercent}%   ${status}`,
    );
  });

  // Detailed Failure Analysis
  console.log("🔍 DETAILED FAILURE ANALYSIS:");
  console.log("──────────────────────────────────────────────────");
  console.log(`📊 Total Questions: ${report.summary.total}`);
  console.log(`❌ Failed Questions: ${report.summary.failed}`);
  console.log(`✅ Passed Questions: ${report.summary.passed}`);
  console.log("");
}

// Main function
async function main() {
  try {
    console.log("🔍 Looking for latest RAGAS evaluation results...");

    const latestReportPath = findLatestReport();
    if (!latestReportPath) {
      console.log("❌ No evaluation reports found.");
      console.log(
        "💡 Run 'npm run test:ragas' first to generate evaluation results.",
      );
      process.exit(1);
    }

    console.log(`📖 Loading report from: ${latestReportPath}`);
    const report = loadReport(latestReportPath);

    displayReport(report);
  } catch (error) {
    console.error("❌ Error displaying results:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}
