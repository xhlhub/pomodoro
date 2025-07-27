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

  // Extract version number from string like "^28.0.0"
  const versionMatch = electronVersion.match(/(\d+\.\d+\.\d+)/);
  const cleanVersion = versionMatch ? versionMatch[1] : electronVersion;

  console.log(`📦 Electron version: ${cleanVersion}`);

  // Step 1: Install app dependencies
  console.log("📥 Installing app dependencies...");
  try {
    execSync("npx electron-builder install-app-deps", { stdio: "inherit" });
  } catch (error) {
    console.warn("⚠️ electron-builder install-app-deps failed, continuing...");
  }

  // Step 2: Rebuild native modules with specific version
  console.log("🔨 Rebuilding native modules...");
  try {
    execSync(`npx @electron/rebuild --version ${cleanVersion}`, {
      stdio: "inherit",
    });
  } catch (error) {
    console.log("Trying rebuild without version specification...");
    execSync("npx @electron/rebuild", { stdio: "inherit" });
  }

  // Step 3: Verify better-sqlite3
  console.log("✅ Verifying better-sqlite3 installation...");
  try {
    const betterSqlite3Path = require.resolve("better-sqlite3");
    console.log(`✅ better-sqlite3 found at: ${betterSqlite3Path}`);
  } catch (error) {
    console.warn("⚠️ better-sqlite3 verification failed, but continuing...");
    console.warn("This might be okay if the module was rebuilt successfully.");
  }

  console.log("🎉 Rebuild completed successfully!");
} catch (error) {
  console.error("❌ Rebuild failed:", error.message);

  // Try a simpler approach
  console.log("🔄 Trying alternative rebuild approach...");
  try {
    execSync("npm rebuild", { stdio: "inherit" });
    console.log("✅ Alternative rebuild succeeded!");
  } catch (fallbackError) {
    console.error("❌ All rebuild attempts failed");
    process.exit(1);
  }
}
