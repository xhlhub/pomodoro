#!/usr/bin/env node

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

console.log("🔧 Starting custom rebuild process...");

try {
  // Check if we're in the right directory
  const packageJsonPath = path.join(process.cwd(), "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(
      "package.json not found. Please run this script from the project root."
    );
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const electronVersion = packageJson.devDependencies?.electron;

  if (!electronVersion) {
    throw new Error("Electron version not found in package.json");
  }

  console.log(`📦 Electron version: ${electronVersion}`);

  // Step 1: Install app dependencies
  console.log("📥 Installing app dependencies...");
  execSync("npx electron-builder install-app-deps", { stdio: "inherit" });

  // Step 2: Rebuild native modules
  console.log("🔨 Rebuilding native modules...");
  execSync(`npx @electron/rebuild --version ${electronVersion} --only-deps`, {
    stdio: "inherit",
  });

  // Step 3: Verify better-sqlite3
  console.log("✅ Verifying better-sqlite3 installation...");
  try {
    const betterSqlite3Path = require.resolve("better-sqlite3");
    console.log(`✅ better-sqlite3 found at: ${betterSqlite3Path}`);
  } catch (error) {
    console.error("❌ better-sqlite3 not found or not properly installed");
    throw error;
  }

  console.log("🎉 Rebuild completed successfully!");
} catch (error) {
  console.error("❌ Rebuild failed:", error.message);
  process.exit(1);
}
