import { GenericModel } from "./GenericModel";
import { IXElementResult, XElements, XElementType } from "../utils/XElements";
import { ModelRaceEnum } from "./defs";
import * as path from "path";

export class CollectionLinkModel {
  collectionAElement: IXElementResult;
  collectionBElement: IXElementResult;

  whereIsTheLinkStored: "A" | "B";
  type: "oneToOne" | "oneToMany" | "manyToOne" | "manyToMany";

  linkFromA: string;
  linkFromB: string;
  fieldName: string;

  // opt-in customisation to just render one of these
  shouldProcessA: boolean = true;
  shouldProcessB: boolean = true;

  get isMany() {
    return ["oneToMany", "manyToMany"].includes(this.type);
  }

  get linkStoredInA() {
    return this.whereIsTheLinkStored === "A";
  }

  get linkStoredInB() {
    return this.whereIsTheLinkStored === "B";
  }

  get isUnique() {
    return ["oneToOne"].includes(this.type);
  }

  get importCollectionALine() {
    // import { A } from "../A.collection.js"
    return this.createImportLine(
      this.collectionAElement,
      this.collectionBElement.importablePath
    );
  }

  get importCollectionBLine() {
    return this.createImportLine(
      this.collectionBElement,
      this.collectionAElement.importablePath
    );
  }

  createImportLine(where: IXElementResult, fromPath) {
    if (where.isExternal) {
      return `import { ${where.identityName} } from "${where.absolutePath}";`;
    }

    let relativePath = XElements.importPath(
      path.dirname(fromPath),
      where.importablePath
    );

    if (relativePath.indexOf("/") === -1) {
      // TODO: make this everywhere
      relativePath = "./" + relativePath;
    }

    return `import { ${where.identityName} } from "${relativePath}";`;
  }
}
