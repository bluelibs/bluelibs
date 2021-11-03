import { GenericModel } from "./GenericModel";
import { IXElementResult, XElements, XElementType } from "../utils/XElements";
import { ModelRaceEnum } from "./defs";
import * as path from "path";
import { ModelUtils, GraphQLFieldMap } from "../utils/ModelUtils";

export class GraphQLMutationModel {
  bundleName: string;
  mutationName: string;
  returnTypeIsArray: boolean;
  returnType: string;
  delegateType: MutationDelegateType;

  // In case of service
  serviceElement: IXElementResult; // relative to microservice
  serviceMethodName: string;

  // In case of delegate to collection
  collectionOperation: GraphQLCollectionMutationOperation;
  collectionElement: IXElementResult; //relative to microservice

  // Security checks
  checkLoggedIn: boolean;
  permissionCheck: boolean;

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
      if (this.delegateType === MutationDelegateType.COLLECTION_ACTION) {
        if (
          this.collectionOperation === GraphQLCollectionMutationOperation.UPDATE
        ) {
          return "";
        }
      }
      return this.inputModel.modelClass;
    }
  }

  get endOperation() {
    switch (this.delegateType) {
      case MutationDelegateType.CUSTOM:
        return `(_, args, ctx, info) => { /* code goes here */ },`;
      case MutationDelegateType.SERVICE:
        return `X.ToService(${this.serviceElement.identityName}, "${
          this.serviceMethodName
        }"${this.hasInput ? "" : ", (_, ctx) => [ctx.userId]"}),`;
      case MutationDelegateType.COLLECTION_ACTION:
        switch (this.collectionOperation) {
          case GraphQLCollectionMutationOperation.INSERT:
            return `X.DocumentInsert(${this.collectionElement.identityName}),`;
          case GraphQLCollectionMutationOperation.UPDATE:
            return `X.DocumentUpdateByID(${this.collectionElement.identityName}),`;
          case GraphQLCollectionMutationOperation.INSERT:
            return `X.DocumenteDeleteByID(${this.collectionElement.identityName}),`;
        }
    }
  }

  get inputFormatted() {
    if (!this.hasInput) {
      return "";
    }

    if (this.delegateType === MutationDelegateType.COLLECTION_ACTION) {
      switch (this.collectionOperation) {
        case GraphQLCollectionMutationOperation.INSERT:
          return `(document: ${this.inputClass}!)`;
        case GraphQLCollectionMutationOperation.UPDATE:
          return `(_id: ID!, dataSet: JSON!)`;
        case GraphQLCollectionMutationOperation.INSERT:
          return `(_id: ID!)`;
      }
    } else {
      return `(input: ${this.inputClass}!)`;
    }
  }

  get inputImportLine() {
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
}

export enum MutationDelegateType {
  SERVICE = "service",
  COLLECTION_ACTION = "collection-action",
  CUSTOM = "custom",
}

export enum GraphQLCollectionMutationOperation {
  UPDATE = "update",
  INSERT = "insert",
  DELETE = "delete",
}
