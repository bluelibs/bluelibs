import { GenericModel } from "./GenericModel";
import { IXElementResult, XElements, XElementType } from "../utils/XElements";
import { ModelRaceEnum } from "./defs";
import * as path from "path";
import * as _ from "lodash";
import { EJSON } from "@bluelibs/ejson";

export class FixtureModel {
  bundleName: string;
  collectionElement: IXElementResult;
  fixtureName: string;
  dataMapMode: boolean = false;
  dataMap: { [mongoDBCollectionName: string]: any[] };

  // Representing the path of the fixture
  targetPath: string;

  get fixtureClass() {
    return _.upperFirst(this.fixtureName) + "Fixture";
  }

  get collectionClass() {
    return this.collectionElement.identityName;
  }

  get collectionVariable() {
    return _.lowerFirst(this.collectionClass);
  }

  get importCollectionLine() {
    // import { A } from "../A.collection.js"
    return this.createImportLine(this.collectionElement, this.targetPath);
  }

  get dataMapStringified() {
    return EJSON.stringify(this.dataMap);
  }

  createImportLine(where: IXElementResult, fromPath) {
    const relativePath = XElements.importPath(
      path.dirname(fromPath),
      where.importablePath
    );

    return `import { ${where.identityName} } from "${relativePath}";`;
  }
}
