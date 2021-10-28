import * as _ from "lodash";
import { XElementType, IXElementResult, XElements } from "../utils/XElements";
import * as path from "path";

// This model does not have an inquirer
// It just has a writer
export class UnitTestModel {
  bundleName: string;
  element: IXElementResult;
  testTargetPath: string;
  methodNames: string[] = [];
  methodContents: string;

  get testItem() {
    return this.element.identityName;
  }

  createImportLines() {
    const relativePath = XElements.importPath(
      path.dirname(this.testTargetPath),
      this.element.importablePath
    );

    return `
import { ${this.element.identityName} } from "${relativePath}";
import { container } from "../../../__tests__/ecosystem";
`;
  }
}
