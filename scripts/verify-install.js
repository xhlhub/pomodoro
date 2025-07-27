#!/usr/bin/env node

const fs = require("fs");

console.log("🔍 Verifying installation...");

const requiredPackages = [
  "react",
  "react-dom",
  "electron",
  "@electron/rebuild",
  "better-sqlite3",
  "typescript",
  "electron-builder",
];

let allGood = true;

requiredPackages.forEach((pkg) => {
  try {
    const path = require.resolve(pkg);
    console.log(`✅ ${pkg}: ${path}`);
  } catch (error) {
    console.log(`❌ ${pkg}: NOT FOUND`);
    allGood = false;
  }
});

// Check specific functionality
try {
  const sqlite3 = require("better-sqlite3");
  console.log("✅ better-sqlite3: Can be imported successfully");
} catch (error) {
  console.log("❌ better-sqlite3: Import failed -", error.message);
  allGood = false;
}

if (allGood) {
  console.log("\n🎉 All dependencies verified successfully!");
  process.exit(0);
} else {
  console.log("\n❌ Some dependencies are missing or broken");
  process.exit(1);
}
