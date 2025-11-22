#!/usr/bin/env tsx

import express from "express";
import cors from "cors";
import * as fs from "fs";
import * as path from "path";

// Load environment variables (same as DKG Node does)
import dotenv from "dotenv";
dotenv.config({ path: path.join(__dirname, "../../.env") });
dotenv.config({ path: path.join(__dirname, "../../.env.development.local") });

const app = express();
const port = process.env.RAGAS_DASHBOARD_PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static files and API endpoints
app.use("/api", express.json());

interface EvaluationReport {
  timestamp: string;
  scores: Record<string, number>;
  summary: {
    overall: {
      averageScore: number;
      passRate: number;
    };
    byMetric: Record<string, any>;
    passed: number;
    failed: number;
    total: number;
  };
  recommendations: string[];
  config?: any;
  detailedResults?: any;
}

function getReportsDirectory(): string {
  // Reports are in the same directory structure as dashboard
  return path.join(__dirname, "reports");
}

function getAllReports(): any[] {
  const reportsDir = getReportsDirectory();

  if (!fs.existsSync(reportsDir)) {
    return [];
  }

  const reportDirs = fs
    .readdirSync(reportsDir)
    .filter((dir) => dir.startsWith("evaluation-"))
    .sort()
    .reverse();

  const reports = reportDirs
    .map((dir) => {
      const reportPath = path.join(reportsDir, dir, "evaluation-report.json");

      if (fs.existsSync(reportPath)) {
        try {
          const reportData = JSON.parse(fs.readFileSync(reportPath, "utf-8"));
          return {
            id: dir,
            timestamp: reportData.timestamp,
            summary: reportData.summary,
            path: reportPath,
          };
        } catch (error) {
          console.error(`Error reading report ${dir}:`, error);
          return null;
        }
      }
      return null;
    })
    .filter((report) => report !== null);

  return reports;
}

function getLatestReport(): EvaluationReport | null {
  const reports = getAllReports();
  if (reports.length === 0) return null;

  try {
    const latestReportPath = reports[0].path;
    return JSON.parse(fs.readFileSync(latestReportPath, "utf-8"));
  } catch (error) {
    console.error("Error loading latest report:", error);
    return null;
  }
}

// API Routes
app.get("/api/reports", (req: express.Request, res: express.Response) => {
  try {
    const reports = getAllReports();
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: "Failed to load reports" });
  }
});

app.get("/api/reports/:id", (req: express.Request, res: express.Response) => {
  try {
    const reportId = req.params.id;
    if (!reportId) {
      return res.status(400).json({ error: "Report ID is required" });
    }
    const reportPath = path.join(
      getReportsDirectory(),
      reportId,
      "evaluation-report.json",
    );

    if (!fs.existsSync(reportPath)) {
      return res.status(404).json({ error: "Report not found" });
    }

    const reportData = JSON.parse(fs.readFileSync(reportPath, "utf-8"));
    res.json(reportData);
  } catch (error) {
    res.status(500).json({ error: "Failed to load report" });
  }
});

app.get("/api/latest", (req: express.Request, res: express.Response) => {
  try {
    const latestReport = getLatestReport();
    if (!latestReport) {
      return res.status(404).json({ error: "No reports available" });
    }
    res.json(latestReport);
  } catch (error) {
    res.status(500).json({ error: "Failed to load latest report" });
  }
});

// Serve the dashboard HTML
app.get("/", (req: express.Request, res: express.Response) => {
  const html = generateDashboardHTML();
  res.send(html);
});

function generateDashboardHTML(): string {
  const latestReport = getLatestReport();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DKG Node RAGAS Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f6fa; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; text-align: center; }
        .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
        .card { background: white; border-radius: 12px; padding: 1.5rem; margin: 1rem 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; }
        .metric-card { padding: 1rem; border-radius: 8px; text-align: center; }
        .metric-pass { background: #d4edda; border-left: 4px solid #28a745; }
        .metric-fail { background: #f8d7da; border-left: 4px solid #dc3545; }
        .score { font-size: 2rem; font-weight: bold; margin: 0.5rem 0; }
        .status { font-weight: bold; text-transform: uppercase; }
        .summary-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; text-align: center; }
        .stat-item { padding: 1rem; }
        .stat-value { font-size: 1.8rem; font-weight: bold; color: #667eea; }
        .refresh-btn { background: #667eea; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; }
        .refresh-btn:hover { background: #5a6fd8; }
        .no-data { text-align: center; color: #666; padding: 3rem; }
        .timestamp { color: #888; font-size: 0.9rem; }
        .recommendations { background: #fff3cd; padding: 1rem; border-radius: 8px; border-left: 4px solid #ffc107; }
        .footer { text-align: center; margin-top: 2rem; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔬 DKG Node RAGAS Dashboard</h1>
        <p>Real-time evaluation monitoring for your DKG Node</p>
    </div>

    <div class="container">
        ${latestReport ? generateReportHTML(latestReport) : generateNoDataHTML()}
    </div>

    <div class="footer">
        <p>Powered by RAGAS Framework | Auto-refresh every 30 seconds</p>
    </div>

    <script>
        function refreshData() {
            console.log('Refreshing dashboard...');
            location.reload();
        }
        
        // Auto-refresh every 30 seconds
        ${process.env.RAGAS_AUTO_REFRESH === "false" ? "" : "setInterval(refreshData, 30000);"}
        
        // Add refresh button functionality
        document.addEventListener('DOMContentLoaded', function() {
            const refreshBtns = document.querySelectorAll('.refresh-btn');
            refreshBtns.forEach(btn => {
                btn.addEventListener('click', refreshData);
            });
        });
    </script>
</body>
</html>`;
}

function generateReportHTML(report: EvaluationReport): string {
  const timestamp = new Date(report.timestamp).toLocaleString();

  return `
    <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h2>📊 Latest Evaluation Results</h2>
            <div>
                <button class="refresh-btn" onclick="refreshData()">🔄 Refresh</button>
                <span class="timestamp">${timestamp}</span>
            </div>
        </div>
        
        <div class="summary-stats">
            <div class="stat-item">
                <div class="stat-value">${(report.summary.overall.averageScore * 100).toFixed(1)}%</div>
                <div>Overall Score</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${(report.summary.overall.passRate * 100).toFixed(1)}%</div>
                <div>Pass Rate</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${report.summary.passed}</div>
                <div>Metrics Passed</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${report.summary.failed}</div>
                <div>Metrics Failed</div>
            </div>
        </div>
    </div>

    <div class="card">
        <h3>📈 Detailed Metrics</h3>
        <div class="metrics-grid">
            ${Object.entries(report.summary.byMetric)
              .map(
                ([metric, data]: [string, any]) => `
                <div class="metric-card ${data.passed ? "metric-pass" : "metric-fail"}">
                    <h4>${metric.replace(/_/g, " ").toUpperCase()}</h4>
                    <div class="score">${(data.score * 100).toFixed(1)}%</div>
                    <div class="status">${data.status}</div>
                    <div style="font-size: 0.9rem; margin-top: 0.5rem;">
                        Threshold: ${(data.threshold * 100).toFixed(1)}%
                    </div>
                </div>
            `,
              )
              .join("")}
        </div>
    </div>

    ${
      report.recommendations && report.recommendations.length > 0
        ? `
        <div class="card">
            <h3>💡 Recommendations</h3>
            <div class="recommendations">
                <ul>
                    ${report.recommendations.map((rec) => `<li>${rec}</li>`).join("")}
                </ul>
            </div>
        </div>
    `
        : ""
    }

    ${report.detailedResults ? generateDetailedAnalysisHTML(report.detailedResults) : ""}
    `;
}

function generateDetailedAnalysisHTML(detailedResults: any): string {
  if (!detailedResults.failures || detailedResults.failures.length === 0) {
    return `
        <div class="card">
            <h3>🔍 Detailed Analysis</h3>
            <p><strong>Total Questions:</strong> ${detailedResults.totalQuestions || 0}</p>
            <p><strong>Passed Questions:</strong> ${detailedResults.passedQuestions || 0}</p>
            <p><strong>Failed Questions:</strong> ${detailedResults.failedQuestions || 0}</p>
            <p style="color: green;">🎉 All questions passed!</p>
        </div>
    `;
  }

  // Group failures by metric
  const metricFailures: Record<string, any[]> = {};
  detailedResults.failures.forEach((failure: any) => {
    if (failure.failedMetrics && Array.isArray(failure.failedMetrics)) {
      failure.failedMetrics.forEach((metric: any) => {
        if (metric && metric.metric) {
          if (!metricFailures[metric.metric]) {
            metricFailures[metric.metric] = [];
          }
          const metricArray = metricFailures[metric.metric];
          if (metricArray) {
            metricArray.push({
              ...failure,
              metricScore: metric.score,
              metricThreshold: metric.threshold,
              metricGap: metric.gap,
            });
          }
        }
      });
    }
  });

  return `
    <div class="card">
        <h3>🔍 Detailed Analysis</h3>
        <div class="summary-stats">
            <div class="stat-item">
                <div class="stat-value">${detailedResults.totalQuestions || 0}</div>
                <div>Total Questions</div>
            </div>
            <div class="stat-item">
                <div class="stat-value" style="color: #28a745;">${detailedResults.passedQuestions || 0}</div>
                <div>Passed Questions</div>
            </div>
            <div class="stat-item">
                <div class="stat-value" style="color: #dc3545;">${detailedResults.failedQuestions || 0}</div>
                <div>Failed Questions</div>
            </div>
        </div>
    </div>


    <div class="card">
        <h3>📋 Question-by-Question Analysis</h3>
        <div style="max-height: 600px; overflow-y: auto;">
            ${detailedResults.failures
              .map(
                (failure: any, index: number) => `
                <div style="margin-bottom: 1.5rem; padding: 1.5rem; background: white; border-radius: 8px; border-left: 4px solid #dc3545; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="font-weight: bold; font-size: 1.1rem; margin-bottom: 1rem; color: #333;">
                        Question ${failure.questionIndex}: ${failure.question}
                    </div>
                    
                    <div style="margin-bottom: 1rem;">
                        <div style="font-weight: bold; margin-bottom: 0.5rem; color: #666;">📝 DKG Node Answer:</div>
                        <div style="padding: 0.75rem; background: #f8f9fa; border-radius: 4px; font-style: italic; color: #555; border-left: 3px solid #6c757d;">
                            "${failure.dkgAnswer}"
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 1rem;">
                        <div style="font-weight: bold; margin-bottom: 0.5rem; color: #28a745;">✅ Expected Answer:</div>
                        <div style="padding: 0.75rem; background: #d4edda; border-radius: 4px; color: #155724; border-left: 3px solid #28a745;">
                            "${failure.expectedAnswer}"
                        </div>
                    </div>
                    
                    <div>
                        <div style="font-weight: bold; margin-bottom: 0.5rem; color: #dc3545;">❌ Failed Metrics:</div>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 0.5rem;">
                            ${
                              failure.failedMetrics && failure.failedMetrics.map
                                ? failure.failedMetrics
                                    .map(
                                      (metric: any) => `
                                <div style="padding: 0.5rem; background: #f8d7da; border-radius: 4px; font-size: 0.9rem;">
                                    <div style="font-weight: bold; color: #721c24;">
                                        ${metric.metric ? metric.metric.replace(/_/g, " ").toUpperCase() : "Unknown Metric"}
                                    </div>
                                    <div style="color: #856404;">
                                        Score: ${metric.score || "N/A"} (Threshold: ${metric.threshold || "N/A"})
                                    </div>
                                    <div style="color: #721c24; font-size: 0.8rem;">
                                        Gap: ${metric.gap || "N/A"}
                                    </div>
                                </div>
                            `,
                                    )
                                    .join("")
                                : '<div style="color: #666;">No metric data available</div>'
                            }
                        </div>
                    </div>
                </div>
            `,
              )
              .join("")}
        </div>
    </div>
  `;
}

function generateNoDataHTML(): string {
  return `
    <div class="card">
        <div class="no-data">
            <h2>📊 No Evaluation Data Available</h2>
            <p>Run an evaluation to see results here.</p>
            <br>
            <p><strong>To run an evaluation:</strong></p>
            <code>npm run test:ragas</code>
            <br><br>
            <button class="refresh-btn" onclick="refreshData()">🔄 Check for New Data</button>
        </div>
    </div>
    `;
}

// Start server
const server = app.listen(port, () => {
  console.log(
    `🌐 DKG Node RAGAS Dashboard running at http://localhost:${port}`,
  );
  console.log("📊 Dashboard features:");
  console.log("   - Real-time evaluation results");
  console.log("   - Metric performance tracking");
  console.log("   - Recommendations and insights");
  console.log("   - Auto-refresh every 30 seconds");
  console.log("");
  console.log(
    "🔄 The dashboard will automatically refresh when new evaluations are available",
  );
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🔌 Shutting down dashboard server...");
  server.close(() => {
    console.log("✅ Dashboard server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("\n🔌 Shutting down dashboard server...");
  server.close(() => {
    console.log("✅ Dashboard server closed");
    process.exit(0);
  });
});
