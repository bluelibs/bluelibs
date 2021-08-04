import * as path from "path";
import * as fs from "fs";
import {
  map,
  IElement,
  IElementMap,
  IElementGroup,
  isElementSingle,
  isElementGroup,
} from "./blueprint";
import { execSync } from "child_process";
import * as fse from "fs-extra";

const PACKAGE_DIR = path.join(__dirname, "..", "..", "packages");
const API_PATH = path.join(__dirname, "..", "static", "type-docs");
const DOCS_DIR = path.join(__dirname, "..", "docs");
const DOC_FILE = "DOCUMENTATION.md";
const SIDEBARS_FILE = path.join(__dirname, "..", "sidebars.js");

const sidebar = {};
for (const sidebarGroup in map) {
  const elements: Array<IElement | IElementGroup> = map[sidebarGroup];

  // write sidebar.js
  sidebar[sidebarGroup] = processSidebarElements(elements);
}

const contents = `
module.exports = {
  someSidebar: ${JSON.stringify(sidebar, null, 4)}
}
`;

fs.writeFileSync(SIDEBARS_FILE, contents);

console.log("Completed generating documentation.");

/**
 * Returns doc ids
 * @param elements
 */
function processSidebarElements(
  elements: Array<IElement | IElementGroup>
): string[] {
  const result = [];
  elements.forEach((element) => {
    if (isElementSingle(element)) {
      pushNewSingleElement(element, result);
    }
    if (isElementGroup(element)) {
      const newItems = [];

      element.elements.forEach((element) => {
        pushNewSingleElement(element, newItems);
      });

      result.push({
        type: "category",
        label: element.groupLabel,
        items: newItems,
      });
    }
  });

  return result;
}

function pushNewSingleElement(element: IElement, result: any[]) {
  if (element.package) {
    const GENERATED_ID = `package-${element.id}`;
    const GENERATED_FILE = `${GENERATED_ID}.mdx`;
    const packageJsonPath = path.join(
      PACKAGE_DIR,
      element.package,
      "package.json"
    );
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

    result.push(GENERATED_ID);

    const typeDefsSection = element.typeDocs ? "containsTypeDefs" : "";

    const prefix = `---
id: ${GENERATED_ID}
title: ${element.title}
---

import { PackageHeader } from "@site/src/components/PackageHeader";

<PackageHeader version="${packageJson.version}" packageName="${element.package}" ${typeDefsSection} />
`;

    const docFilePath = path.join(PACKAGE_DIR, element.package, DOC_FILE);
    const contents = prefix + "\n" + fs.readFileSync(docFilePath);

    fs.writeFileSync(path.join(DOCS_DIR, GENERATED_FILE), contents);

    if (element.typeDocs) {
      try {
        // generateTypeDoc(element.package);
      } catch (e) {
        console.error(e);
      }
    }
  } else {
    result.push(element.id);
  }
}

function generateTypeDoc(packageName: string) {
  const packagePath = path.join(PACKAGE_DIR, packageName);
  console.log(`Generating type docs for ${packageName} ...`);
  execSync(`npm run gen-doc`, {
    cwd: packagePath,
  });

  fse.copy(
    path.join(packagePath, "typeDocs"),
    path.join(API_PATH, path.basename(packagePath))
  );
}
