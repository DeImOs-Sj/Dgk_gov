#!/usr/bin/env node

/**
 * Simple log viewer for Knowledge Asset Manager
 * Usage: npm run logs [lines]
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const logsDir = path.resolve(__dirname, "../logs");
const today = new Date().toISOString().split("T")[0];
const logFile = path.join(logsDir, `kam-${today}.log`);

const lines = parseInt(process.argv[2]) || 50;

console.log(`\n📋 Knowledge Asset Manager Logs - ${today}`);
console.log("=".repeat(60));

if (!fs.existsSync(logFile)) {
  console.log(`❌ No log file found for today: ${logFile}`);
  process.exit(1);
}

// Create interface for reading file line by line
const rl = readline.createInterface({
  input: fs.createReadStream(logFile),
  crlfDelay: Infinity,
});

const logLines = [];

rl.on("line", (line) => {
  if (line.trim()) {
    logLines.push(line);
  }
});

rl.on("close", () => {
  const recentLogs = logLines.slice(-lines);

  recentLogs.forEach((line) => {
    try {
      const log = JSON.parse(line);
      const level = log.level?.toUpperCase() || "INFO";
      const color =
        {
          ERROR: "\x1b[31m",
          WARN: "\x1b[33m",
          INFO: "\x1b[36m",
          DEBUG: "\x1b[90m",
        }[level] || "\x1b[0m";

      console.log(
        `${color}[${log.timestamp}] [${level}] ${log.service ? `[${log.service}]` : ""} ${log.message}\x1b[0m`,
      );

      // Show metadata if present
      const { timestamp, level: _, message, service, ...metadata } = log;
      if (Object.keys(metadata).length > 0) {
        console.log(`  \x1b[90m${JSON.stringify(metadata)}\x1b[0m`);
      }
    } catch {
      // Raw line if not JSON
      console.log(line);
    }
  });

  console.log("\n=".repeat(60));
  console.log(
    `Showing last ${recentLogs.length} lines. Use 'npm run logs [number]' to see more.`,
  );
});
