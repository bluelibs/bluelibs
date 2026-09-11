const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const PACKAGES_DIR = path.join(__dirname, "..", "packages");

console.log("Running npm audit fix in all packages...\n");
console.log("=".repeat(70));

const packages = fs
  .readdirSync(PACKAGES_DIR)
  .filter((dir) => {
    const dirPath = path.join(PACKAGES_DIR, dir);
    return fs.statSync(dirPath).isDirectory() && fs.existsSync(path.join(dirPath, "package.json"));
  })
  .sort();

let successCount = 0;
let failCount = 0;
let vulnerabilitiesFixed = 0;

packages.forEach((pkg) => {
  const pkgPath = path.join(PACKAGES_DIR, pkg);

  process.stdout.write(`🔒 ${pkg.padEnd(35)} `);

  try {
    const output = execSync("npm audit fix 2>&1", {
      cwd: pkgPath,
      encoding: "utf8",
      timeout: 120000,
      stdio: ["pipe", "pipe", "pipe"],
    });

    // Count fixed vulnerabilities
    const fixedMatch = output.match(/fixed (\d+) vulnerabil/);
    if (fixedMatch) {
      vulnerabilitiesFixed += parseInt(fixedMatch[1]);
    }

    console.log("✅");
    successCount++;
  } catch (error) {
    // npm audit fix returns exit code 1 if vulnerabilities remain
    if (error.stdout && error.stdout.includes("fixed")) {
      const fixedMatch = error.stdout.match(/fixed (\d+) vulnerabil/);
      if (fixedMatch) {
        vulnerabilitiesFixed += parseInt(fixedMatch[1]);
      }
      console.log("⚠️  (partial)");
      successCount++;
    } else {
      console.log("❌");
      failCount++;
    }
  }
});

console.log("=".repeat(70));
console.log(`\n✅ Successfully processed: ${successCount}/${packages.length}`);
console.log(`❌ Failed: ${failCount}/${packages.length}`);
console.log(`🔒 Total vulnerabilities fixed: ${vulnerabilitiesFixed}`);
console.log("\nNext: Run npm audit in each package to check remaining issues");
