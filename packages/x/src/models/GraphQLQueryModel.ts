import { GenericModel } from "./GenericModel";
import { IXElementResult, XElements, XElementType } from "../utils/XElements";
import { ModelRaceEnum } from "./defs";
import * as path from "path";
import { GraphQLFieldMap } from "../utils/ModelUtils";

export class GraphQLQueryModel {
  bundleName: string;
  queryName: string;
  returnType: string;
  returnTypeIsArray: boolean;
  delegateType: QueryDelegateType;

  // Security checks
  checkLoggedIn: boolean;
  permissionCheck: boolean;

  collectionElement: IXElementResult; //relative to microservice

  // In case of service
  serviceElement: IXElementResult; // relative to microservice
  serviceMethodName: string;

  // Model checks
  hasInput: boolean;
  inputAlreadyExists: boolean;
  inputElement?: IXElementResult; // relative to microservice
  inputModel?: GenericModel = new GenericModel(
    null,
    ModelRaceEnum.GRAPHQL_INPUT
  );

  // In the writing process store this so we can do proper imports
  resolverTargetPath: string;

  get returnTypeFormatted() {
    if (this.returnType === "void") {
      return "Boolean";
    }

    const returnType = GraphQLFieldMap[this.returnType] || this.returnType;

    if (this.returnTypeIsArray) {
      return `[${returnType}]!`;
    }

    return returnType + "!";
  }
  get collectionClass() {
    return this.collectionElement.identityName;
  }

  get inputClass() {
    if (this.inputAlreadyExists) {
      return this.inputElement.identityName;
    } else {
      return this.inputModel.modelClass;
    }
  }

  get endOperation() {
    switch (this.delegateType) {
      case QueryDelegateType.CUSTOM:
        return `(_, args, ctx, info) => { /* code goes here */ },`;
      case QueryDelegateType.SERVICE:
        return `X.ToService(${this.serviceElement.identityName}, "${
          this.serviceMethodName
        }"${this.hasInput ? "" : ", (_, ctx) => [ctx.userId]"}),`;
      case QueryDelegateType.NOVA:
        if (this.returnTypeIsArray) {
          return `ToNova()`;
        } else {
          return `ToNovaOne()`;
        }
    }
  }

  get inputFormatted() {
    if (this.isNova()) {
      return `(query: QueryInput)`;
    }

    if (!this.hasInput) {
      return "";
    }

    return `(input: ${this.inputClass}!)`;
  }

  get inputImportLine() {
    if (this.isNova()) {
      return;
    }

    return this.createImportLine(this.inputElement);
  }

  get collectionImportLine() {
    return this.createImportLine(this.collectionElement);
  }

  get serviceImportLine() {
    return this.createImportLine(this.serviceElement);
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

  isNova() {
    return this.delegateType === QueryDelegateType.NOVA;
  }
}

export enum QueryDelegateType {
  SERVICE = "service",
  NOVA = "nova",
  CUSTOM = "custom",
}
