#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🔧 Starting dependency installation...");

function runCommand(command, options = {}) {
  try {
    console.log(`▶ Running: ${command}`);
    execSync(command, { stdio: "inherit", ...options });
    return true;
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    console.error(error.message);
    return false;
  }
}

function cleanupFiles() {
  const filesToRemove = ["package-lock.json", "yarn.lock"];

  filesToRemove.forEach((file) => {
    if (fs.existsSync(file)) {
      console.log(`🗑️ Removing ${file}...`);
      fs.unlinkSync(file);
    }
  });

  if (fs.existsSync("node_modules")) {
    console.log("🗑️ Removing node_modules...");
    fs.rmSync("node_modules", { recursive: true, force: true });
  }
}

async function main() {
  try {
    console.log("📋 Node.js version:", process.version);
    console.log(
      "📋 npm version:",
      execSync("npm --version", { encoding: "utf8" }).trim()
    );

    // Method 1: Try npm install with legacy peer deps
    console.log("\n🚀 Method 1: npm install with legacy peer deps...");
    if (runCommand("npm install --legacy-peer-deps")) {
      console.log("✅ Method 1 succeeded!");
      return;
    }

    // Method 2: Clean and retry
    console.log("\n🚀 Method 2: Clean install...");
    cleanupFiles();

    if (runCommand("npm install --legacy-peer-deps --no-optional")) {
      console.log("✅ Method 2 succeeded!");
      return;
    }

    // Method 3: Install with different flags
    console.log("\n🚀 Method 3: Install with relaxed constraints...");
    if (
      runCommand(
        "npm install --legacy-peer-deps --force --no-optional --no-audit"
      )
    ) {
      console.log("✅ Method 3 succeeded!");
      return;
    }

    // Method 4: Manual install of problematic packages
    console.log("\n🚀 Method 4: Manual package installation...");
    const commands = [
      "npm install react@^18.2.0 react-dom@^18.2.0 react-scripts@5.0.1 --legacy-peer-deps",
      "npm install electron@^28.0.0 electron-builder@^24.9.1 --legacy-peer-deps",
      "npm install better-sqlite3@^11.10.0 --legacy-peer-deps",
      "npm install @electron/rebuild@^3.7.2 --legacy-peer-deps",
      "npm install typescript@^4.9.5 concurrently@^8.2.2 wait-on@^7.2.0 --legacy-peer-deps",
      "npm install @types/node@^20.19.9 @types/react@^18.3.23 @types/react-dom@^18.3.7 @types/better-sqlite3@^7.6.13 @types/electron@^1.4.38 --legacy-peer-deps",
    ];

    let success = true;
    for (const cmd of commands) {
      if (!runCommand(cmd)) {
        success = false;
        break;
      }
    }

    if (success) {
      console.log("✅ Method 4 succeeded!");
      return;
    }

    throw new Error("All installation methods failed");
  } catch (error) {
    console.error("❌ Installation failed:", error.message);
    console.log("\n📋 Diagnostic information:");
    console.log("Current directory:", process.cwd());
    console.log(
      "Files in directory:",
      fs.readdirSync(".").filter((f) => !f.startsWith("."))
    );

    process.exit(1);
  }
}

main();
