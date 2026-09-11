const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const PACKAGES_DIR = path.join(__dirname, "..", "packages");

console.log("=".repeat(70));
console.log("SECURITY AUDIT ACROSS ALL PACKAGES");
console.log("=".repeat(70));

const packages = fs
  .readdirSync(PACKAGES_DIR)
  .filter((dir) => {
    const dirPath = path.join(PACKAGES_DIR, dir);
    return fs.statSync(dirPath).isDirectory() && fs.existsSync(path.join(dirPath, "package.json"));
  })
  .sort();

let totalVulnerabilities = 0;
let criticalCount = 0;
let highCount = 0;
let moderateCount = 0;
let lowCount = 0;
const packagesWithVulnerabilities = new Set();

packages.forEach((pkg) => {
  const pkgPath = path.join(PACKAGES_DIR, pkg);

  try {
    const output = execSync("npm audit --json 2>&1", {
      cwd: pkgPath,
      encoding: "utf8",
      timeout: 60000,
      stdio: "pipe",
    });

    const audit = JSON.parse(output);
    const vulns = audit.metadata?.vulnerabilities || {};

    const pkgTotal =
      (vulns.critical || 0) + (vulns.high || 0) + (vulns.moderate || 0) + (vulns.low || 0);

    criticalCount += vulns.critical || 0;
    highCount += vulns.high || 0;
    moderateCount += vulns.moderate || 0;
    lowCount += vulns.low || 0;
    totalVulnerabilities += pkgTotal;

    if (pkgTotal > 0) {
      console.log(`${pkg.padEnd(35)} ⚠️  ${pkgTotal} vulnerabilities`);
      packagesWithVulnerabilities.add(pkg);
    } else {
      console.log(`${pkg.padEnd(35)} ✅ Clean`);
    }
  } catch (error) {
    // npm audit returns exit code 1 if vulnerabilities found
    try {
      const audit = JSON.parse(error.stdout || "{}");
      const vulns = audit.metadata?.vulnerabilities || {};

      const pkgTotal =
        (vulns.critical || 0) + (vulns.high || 0) + (vulns.moderate || 0) + (vulns.low || 0);

      criticalCount += vulns.critical || 0;
      highCount += vulns.high || 0;
      moderateCount += vulns.moderate || 0;
      lowCount += vulns.low || 0;
      totalVulnerabilities += pkgTotal;

      if (pkgTotal > 0) {
        console.log(`${pkg.padEnd(35)} ⚠️  ${pkgTotal} vulnerabilities`);
        packagesWithVulnerabilities.add(pkg);
      } else {
        console.log(`${pkg.padEnd(35)} ✅ Clean`);
      }
    } catch (parseError) {
      console.log(`${pkg.padEnd(35)} ❌ Audit failed`);
    }
  }
});

console.log("=".repeat(70));
console.log(`\n🔒 TOTAL VULNERABILITIES: ${totalVulnerabilities}`);
console.log(`  Critical: ${criticalCount}`);
console.log(`  High: ${highCount}`);
console.log(`  Moderate: ${moderateCount}`);
console.log(`  Low: ${lowCount}`);
console.log(
  `\nPackages with vulnerabilities: ${packagesWithVulnerabilities.size}/${packages.length}`
);

process.exit(totalVulnerabilities > 0 ? 1 : 0);
