#!/usr/bin/env node

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const packagesDir = path.join(__dirname, "..", "packages");

const packages = fs
  .readdirSync(packagesDir)
  .filter((name) => {
    const pkgJsonPath = path.join(packagesDir, name, "package.json");
    return fs.existsSync(pkgJsonPath);
  })
  .sort();

console.log(`Installing dependencies for ${packages.length} packages...\n`);

// Install root dependencies first
console.log("Installing root dependencies...");
execSync("npm install", {
  cwd: path.join(__dirname, ".."),
  stdio: "inherit",
});

// Bootstrap via lerna
console.log("\nBootstrapping packages with lerna...");
execSync("npx lerna bootstrap", {
  cwd: path.join(__dirname, ".."),
  stdio: "inherit",
});

console.log("\nAll packages installed successfully.");
