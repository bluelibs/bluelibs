import { GenericModel } from "./GenericModel";
import { IXElementResult, XElements, XElementType } from "../utils/XElements";
import { ModelRaceEnum } from "./defs";
import * as path from "path";

export class GraphQLCRUDModel {
  bundleName: string;
  crudName: string;
  collectionElement: IXElementResult;
  graphqlEntityElement: IXElementResult;
  checkLoggedIn: boolean;
  permissionCheck: boolean;
  resolverTargetPath: string;
  hasCustomInputs: boolean;
  insertInputModelDefinition: GenericModel;
  updateInputModelDefinition: GenericModel;
  hasSubscriptions: boolean = false;

  get collectionClass() {
    return this.collectionElement.identityName;
  }

  get entityType() {
    return this.graphqlEntityElement.identityName;
  }

  get collectionImportLine() {
    return this.createImportLine(this.collectionElement);
  }

  get inputsImportLine() {
    const relativePath = XElements.importPath(
      path.dirname(this.resolverTargetPath),
      path.join(
        this.resolverTargetPath,
        "..",
        "..",
        "..",
        "..",
        "services",
        "inputs"
      )
    );

    return `import { ${this.insertInputName}Input, ${this.updateInputName}Input } from "${relativePath}"`;
  }

  get insertInputName() {
    return this.graphqlEntityElement.identityName + "Insert";
  }

  get updateInputName() {
    return this.graphqlEntityElement.identityName + "Update";
  }

  createImportLine(element: IXElementResult) {
    if (!element) {
      return;
    }

    const relativePath = XElements.importPath(
      path.dirname(this.resolverTargetPath),
      element.importablePath
    );

    return `import { ${element.identityName} } from "${relativePath}"`;
  }
}
