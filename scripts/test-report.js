const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const PACKAGES_DIR = path.join(__dirname, "..", "packages");

console.log("=".repeat(70));
console.log("TEST STATUS REPORT - All Packages");
console.log("=".repeat(70));

const packages = fs
  .readdirSync(PACKAGES_DIR)
  .filter((dir) => {
    const dirPath = path.join(PACKAGES_DIR, dir);
    return fs.statSync(dirPath).isDirectory() && fs.existsSync(path.join(dirPath, "package.json"));
  })
  .sort();

let totalSuites = 0;
let passedSuites = 0;
let failedSuites = 0;
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

packages.forEach((pkg) => {
  const pkgPath = path.join(PACKAGES_DIR, pkg);

  try {
    const output = execSync("npm test 2>&1", {
      cwd: pkgPath,
      encoding: "utf8",
      timeout: 120000,
      stdio: "pipe",
    });

    // Parse test results
    const suitesMatch = output.match(/Test Suites:\s+(\d+)\s+passed/);
    const failedSuitesMatch = output.match(/Test Suites:.*?(\d+)\s+failed/);
    const testsMatch = output.match(/Tests:\s+(\d+)\s+passed/);
    const failedTestsMatch = output.match(/Tests:.*?(\d+)\s+failed/);

    const pkgPassedSuites = suitesMatch ? parseInt(suitesMatch[1]) : 0;
    const pkgFailedSuites = failedSuitesMatch ? parseInt(failedSuitesMatch[1]) : 0;
    const pkgPassedTests = testsMatch ? parseInt(testsMatch[1]) : 0;
    const pkgFailedTests = failedTestsMatch ? parseInt(failedTestsMatch[1]) : 0;

    const pkgTotalSuites = pkgPassedSuites + pkgFailedSuites;
    const pkgTotalTests = pkgPassedTests + pkgFailedTests;

    totalSuites += pkgTotalSuites;
    passedSuites += pkgPassedSuites;
    failedSuites += pkgFailedSuites;
    totalTests += pkgTotalTests;
    passedTests += pkgPassedTests;
    failedTests += pkgFailedTests;

    if (pkgTotalSuites > 0) {
      if (pkgFailedSuites === 0) {
        console.log(`${pkg.padEnd(35)} ✅ ${pkgPassedTests} tests`);
      } else {
        console.log(
          `${pkg.padEnd(35)} ⚠️  ${pkgPassedTests}/${pkgTotalTests} tests (${pkgFailedTests} failing)`
        );
      }
    }
  } catch (error) {
    // Test command failed
    const output = error.stdout || "";
    const suitesMatch = output.match(/Test Suites:\s+(\d+)\s+passed/);
    const failedSuitesMatch = output.match(/Test Suites:.*?(\d+)\s+failed/);
    const testsMatch = output.match(/Tests:\s+(\d+)\s+passed/);
    const failedTestsMatch = output.match(/Tests:.*?(\d+)\s+failed/);

    if (suitesMatch || failedSuitesMatch) {
      const pkgPassedSuites = suitesMatch ? parseInt(suitesMatch[1]) : 0;
      const pkgFailedSuites = failedSuitesMatch ? parseInt(failedSuitesMatch[1]) : 0;
      const pkgPassedTests = testsMatch ? parseInt(testsMatch[1]) : 0;
      const pkgFailedTests = failedTestsMatch ? parseInt(failedTestsMatch[1]) : 0;

      const pkgTotalSuites = pkgPassedSuites + pkgFailedSuites;
      const pkgTotalTests = pkgPassedTests + pkgFailedTests;

      totalSuites += pkgTotalSuites;
      passedSuites += pkgPassedSuites;
      failedSuites += pkgFailedSuites;
      totalTests += pkgTotalTests;
      passedTests += pkgPassedTests;
      failedTests += pkgFailedTests;

      if (pkgTotalSuites > 0) {
        console.log(
          `${pkg.padEnd(35)} ⚠️  ${pkgPassedTests}/${pkgTotalTests} tests (${pkgFailedTests} failing)`
        );
      }
    }
  }
});

console.log("=".repeat(70));
console.log(`\n📊 FINAL TEST STATISTICS:`);
console.log(`✅ Test Suites Passing: ${passedSuites}/${totalSuites}`);
console.log(`✅ Tests Passing: ${passedTests}/${totalTests}`);
if (failedTests > 0) {
  console.log(`❌ Tests Failing: ${failedTests}`);
}
console.log(
  `\nTest Success Rate: ${totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}%`
);
console.log("=".repeat(70));

process.exit(failedTests > 0 ? 1 : 0);
