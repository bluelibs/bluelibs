import * as _ from "lodash";
import { IXElementResult, XElements } from "../utils/XElements";
import * as path from "path";

export class ListenerModel {
  bundleName: string;
  listenerName: string;
  collectionEvents: boolean;
  collectionElement: IXElementResult;
  listenerTargetPath: string;

  get listenerClass() {
    const propperForm = _.upperFirst(_.camelCase(this.listenerName));

    return propperForm + "Listener";
  }

  get collectionEventNames() {
    return [
      "BeforeInsertEvent",
      "AfterInsertEvent",
      "BeforeUpdateEvent",
      "AfterUpdateEvent",
      "BeforeRemoveEvent",
      "AfterRemoveEvent",
    ];
  }

  get collectionImportLine() {
    return this.createImportLine(this.collectionElement);
  }

  get collectionClassName() {
    return this.collectionElement.identityName;
  }

  createImportLine(element: IXElementResult) {
    if (!element) {
      return;
    }

    const relativePath = XElements.importPath(
      path.dirname(this.listenerTargetPath),
      element.importablePath
    );

    return `import { ${element.identityName} } from "${relativePath}"`;
  }
}
