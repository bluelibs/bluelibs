const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const PACKAGES_DIR = path.join(__dirname, "..", "packages");

console.log("=".repeat(70));
console.log("COMPILATION STATUS CHECK");
console.log("=".repeat(70));

const packages = fs
  .readdirSync(PACKAGES_DIR)
  .filter((dir) => {
    const dirPath = path.join(PACKAGES_DIR, dir);
    return fs.statSync(dirPath).isDirectory() && fs.existsSync(path.join(dirPath, "package.json"));
  })
  .sort();

let compiling = 0;
let failing = 0;
const failedPackages = [];

packages.forEach((pkg) => {
  const pkgPath = path.join(PACKAGES_DIR, pkg);

  process.stdout.write(`${pkg.padEnd(35)} `);

  try {
    const output = execSync("npm run compile 2>&1", {
      cwd: pkgPath,
      encoding: "utf8",
      timeout: 60000,
      stdio: "pipe",
    });

    const errorCount = (output.match(/error TS/g) || []).length;

    if (errorCount === 0) {
      console.log("✅ Compiling");
      compiling++;
    } else {
      console.log(`❌ ${errorCount} errors`);
      failing++;
      failedPackages.push({ name: pkg, errors: errorCount });
    }
  } catch (error) {
    const errorCount = ((error.stdout || "").match(/error TS/g) || []).length;
    console.log(`❌ ${errorCount} errors`);
    failing++;
    failedPackages.push({ name: pkg, errors: errorCount });
  }
});

console.log("=".repeat(70));
console.log(`\n✅ Compiling: ${compiling}/${packages.length}`);
console.log(`❌ Failing: ${failing}/${packages.length}`);

if (failedPackages.length > 0) {
  console.log("\nFailing packages:");
  failedPackages.forEach((p) => console.log(`  - ${p.name}: ${p.errors} errors`));
}

process.exit(failing > 0 ? 1 : 0);
