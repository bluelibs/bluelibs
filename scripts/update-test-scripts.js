const fs = require("fs");
const path = require("path");

const PACKAGES_DIR = path.join(__dirname, "..", "packages");

console.log("Updating test scripts in all packages...\n");

const packages = fs
  .readdirSync(PACKAGES_DIR)
  .filter((dir) => {
    const dirPath = path.join(PACKAGES_DIR, dir);
    return fs.statSync(dirPath).isDirectory() && fs.existsSync(path.join(dirPath, "package.json"));
  })
  .sort();

let updatedCount = 0;

packages.forEach((pkg) => {
  const pkgPath = path.join(PACKAGES_DIR, pkg, "package.json");
  const pkgData = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

  if (
    pkgData.scripts &&
    pkgData.scripts.test &&
    pkgData.scripts.test.includes("dist/__tests__/index.js")
  ) {
    pkgData.scripts.test = "jest --verbose";
    if (pkgData.scripts.testWatch) {
      pkgData.scripts.testWatch = "jest --verbose --watch";
    }
    if (pkgData.scripts["test:watch"]) {
      pkgData.scripts["test:watch"] = "jest --verbose --watch";
    }
    fs.writeFileSync(pkgPath, JSON.stringify(pkgData, null, 2) + "\n");
    console.log(`✅ Updated ${pkg}`);
    updatedCount++;
  }
});

console.log(`\n✅ Updated ${updatedCount} packages`);
