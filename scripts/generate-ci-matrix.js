const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.join(__dirname, "..");
const PACKAGES_DIR = path.join(ROOT_DIR, "packages");

const TEST_ENV_OVERRIDES = {
  "mongo-bundle": "mongo",
  "mikroorm-bundle": "mongo",
  nova: "mongo",
  "security-mongo-bundle": "mongo",
  "x-auth-bundle": "mongo",
  "x-bundle": "mongo",
  "x-cron-bundle": "mongo",
  "x-s3-bundle": "mongo",
  "rabbitmq-bundle": "rabbitmq",
};

const SKIP_DIRS = new Set(["node_modules", "dist", "coverage", "typeDocs"]);
const TEST_FILE_PATTERN = /(^|\/)(__tests__\/.*|.*\.(test|spec))\.[cm]?[jt]sx?$/;

function listPackageDirs() {
  return fs
    .readdirSync(PACKAGES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((dirName) => fs.existsSync(path.join(PACKAGES_DIR, dirName, "package.json")))
    .sort();
}

function hasTestFiles(packageDir) {
  const queue = [packageDir];

  while (queue.length > 0) {
    const currentDir = queue.pop();
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) {
          queue.push(fullPath);
        }
        continue;
      }

      const relativePath = path.relative(packageDir, fullPath).split(path.sep).join("/");
      if (TEST_FILE_PATTERN.test(relativePath)) {
        return true;
      }
    }
  }

  return false;
}

function getTestEnvironment(packageName, packageJson) {
  return (
    packageJson.bluelibs?.ci?.testEnvironment ||
    TEST_ENV_OVERRIDES[packageName] ||
    "unit"
  );
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

function collectPackages() {
  return listPackageDirs().map((packageName) => {
    const packageDir = path.join(PACKAGES_DIR, packageName);
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(packageDir, "package.json"), "utf8")
    );
    const scripts = packageJson.scripts || {};

    return {
      package: packageName,
      hasLint: Boolean(scripts.lint),
      hasTestScript: Boolean(scripts.test),
      hasTestCI: Boolean(scripts["test:ci"]),
      hasTests: hasTestFiles(packageDir),
      testEnvironment: getTestEnvironment(packageName, packageJson),
    };
  });
}

function buildOutputs(packages) {
  const lint = uniqueSorted(
    packages.filter((pkg) => pkg.hasLint).map((pkg) => pkg.package)
  );
  const tests = packages.filter(
    (pkg) => pkg.hasTestScript && pkg.hasTestCI && pkg.hasTests
  );

  const testUnit = uniqueSorted(
    tests
      .filter((pkg) => pkg.testEnvironment === "unit")
      .map((pkg) => pkg.package)
  );
  const testMongo = uniqueSorted(
    tests
      .filter((pkg) => pkg.testEnvironment === "mongo")
      .map((pkg) => pkg.package)
  );
  const testRabbitmq = uniqueSorted(
    tests
      .filter((pkg) => pkg.testEnvironment === "rabbitmq")
      .map((pkg) => pkg.package)
  );

  return {
    lint,
    lint_count: String(lint.length),
    test_unit: testUnit,
    test_unit_count: String(testUnit.length),
    test_mongo: testMongo,
    test_mongo_count: String(testMongo.length),
    test_rabbitmq: testRabbitmq,
    test_rabbitmq_count: String(testRabbitmq.length),
  };
}

function writeGithubOutputs(outputs) {
  const githubOutputPath = process.env.GITHUB_OUTPUT;
  if (!githubOutputPath) {
    return;
  }

  const lines = Object.entries(outputs).map(([key, value]) => {
    const serializedValue = Array.isArray(value) ? JSON.stringify(value) : value;
    return `${key}=${serializedValue}`;
  });

  fs.appendFileSync(githubOutputPath, `${lines.join("\n")}\n`);
}

const packages = collectPackages();
const outputs = buildOutputs(packages);

writeGithubOutputs(outputs);

console.log(JSON.stringify({ packages, outputs }, null, 2));
