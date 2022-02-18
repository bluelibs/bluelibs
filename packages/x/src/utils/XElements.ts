import { FSUtils } from "./FSUtils";
import * as fs from "fs";
import * as path from "path";
import * as _ from "lodash";
import * as fg from "fast-glob";

/**
 * The XElements are the common objects we encounter in an X-Framework applications:
 * Collections, Models, GraphQL Entities, Services, Exceptions, Events
 */
export class XElements {
  static emulateElement(
    microservicePath: string,
    bundleName: string,
    type: XElementType,
    identity: string
  ) {
    const bundlePath = path.join(
      microservicePath,
      "src",
      "bundles",
      bundleName
    );

    const relativePath = XElementsBundleRelativePaths[type](identity);

    return XElements.createXElementResult(
      relativePath,
      type,
      bundleName,
      bundlePath
    );
  }

  static findElements(
    type: XElementType,
    microservicePath: string
  ): IXElementResult[] {
    const bundles = FSUtils.listBundles(microservicePath);
    const elements: IXElementResult[] = [];

    bundles.forEach((bundle) => {
      const bundlePath = path.join(microservicePath, "src", "bundles", bundle);
      const files = fg
        .sync(XElementGlob[type], {
          onlyFiles: true,
          cwd: bundlePath,
        })
        .filter((file) => {
          // We do not count indexes as a valid XElement
          return path.basename(file) !== "index.ts";
        });

      files.forEach((file) => {
        elements.push(
          XElements.createXElementResult(file, type, bundle, bundlePath)
        );
      });
    });

    return elements;
  }

  static createXElementResult(
    filePathRelativeToBundle: string,
    type: XElementType,
    bundle: string,
    bundlePath: string
  ): IXElementResult {
    const identityNameRaw = path
      .basename(filePathRelativeToBundle)
      .split(".")
      .slice(0, -1 * XElementFilePortionCut[type])
      .join(".");

    return {
      type,
      bundleName: bundle,
      elementPath: filePathRelativeToBundle,
      absolutePath: path.join(bundlePath, filePathRelativeToBundle),
      // We don't need to worry about .graphql files because we only import .ts files here
      importablePath: path.join(
        bundlePath,
        filePathRelativeToBundle.split(".").slice(0, -1).join(".")
      ),
      identityNameRaw: identityNameRaw,
      identityName:
        // The idea here is that the file ends with either something like .service.ts,
        // either ends with .graphql, so we sometimes need to cut the last 2 parts (splitted by .),
        // sometimes last part. This is what this code does
        identityNameRaw + XElementClassSuffix[type],
    };
  }

  static getRelativeInputPath(inputName): string {
    return path.join("services", "inputs", `${inputName}.input.ts`);
  }

  static importPath(fromFilePath, toImportablePath) {
    return path.relative(fromFilePath, toImportablePath).replace(/\\/g, "/");
  }
}

export interface IXElementResult {
  type: XElementType;
  /**
   * The name of the bundle: CoreBundle
   */
  bundleName?: string;
  /**
   * Path relative to the bundle, example: services/X.service.ts
   */
  elementPath?: string;
  /**
   * This element is not written in the code base it belongs in a diff package
   * Typically this package will be presented as "importablePath"
   */
  isExternal?: boolean;
  /**
   * Path that can be imported (absolute)
   */
  importablePath: string;
  /**
   * Identity name but without the suffix
   */
  identityNameRaw?: string;
  /**
   * example: UserManagerService, UserCollection, UserEntity
   */
  identityName: string;
  /**
   * The absolute path that can be read from anywhere
   */
  absolutePath?: string;
}

export enum XElementType {
  SERVICE = "service",
  EVENT = "event",
  EXCEPTION = "exception",
  LISTENER = "listener",
  COLLECTION = "collection",
  COLLECTION_MODEL = "collection-model",
  GRAPHQL_ENTITY = "graphql-entity",
  GRAPHQL_INPUT = "graphql-input",
  GRAPHQL_INPUT_MODEL = "graphql-input-model",
}

export const XElementsBundleRelativePaths = {
  [XElementType.SERVICE]: (identity) => `services/${identity}.service.ts`,
  [XElementType.EVENT]: (identity) => `events/${identity}.event.ts`,
  [XElementType.EXCEPTION]: (identity) => `exceptions/${identity}.exception.ts`,
  [XElementType.LISTENER]: (identity) => `listeners/${identity}.listener.ts`,
  [XElementType.COLLECTION]: (identity) =>
    `collections/${identity}/${identity}.collection.ts`,
  [XElementType.COLLECTION_MODEL]: (identity) => `collections/.model.ts`,
  [XElementType.GRAPHQL_INPUT_MODEL]: (identity) =>
    `services/inputs/${identity}.ts`,
  [XElementType.GRAPHQL_INPUT]: (identity) =>
    `graphql/inputs/${identity}/${identity}.graphql.ts`,
  [XElementType.GRAPHQL_ENTITY]: (identity) =>
    `graphql/entities/${identity}/${identity}.graphql.ts`,
};

export const XElementGlob = {
  [XElementType.SERVICE]: "services/**/*.service.ts",
  [XElementType.EVENT]: "events/**/*.event.ts",
  [XElementType.EXCEPTION]: "exceptions/**/*.exception.ts",
  [XElementType.LISTENER]: "listeners/**/*.listener.ts",
  [XElementType.COLLECTION]: "collections/**/*.collection.ts",
  [XElementType.COLLECTION_MODEL]: "collections/**/*.model.ts",
  [XElementType.GRAPHQL_INPUT_MODEL]: "services/inputs/**/*.ts",
  [XElementType.GRAPHQL_INPUT]: "graphql/inputs/**/*.graphql.ts",
  [XElementType.GRAPHQL_ENTITY]: "graphql/entities/**/*.graphql.ts",
};

export const XElementFilePortionCut = {
  [XElementType.SERVICE]: 2,
  [XElementType.EVENT]: 2,
  [XElementType.EXCEPTION]: 2,
  [XElementType.LISTENER]: 2,
  [XElementType.COLLECTION]: 2,
  [XElementType.COLLECTION_MODEL]: 2,
  [XElementType.GRAPHQL_INPUT_MODEL]: 2, // ?
  [XElementType.GRAPHQL_INPUT]: 2,
  [XElementType.GRAPHQL_ENTITY]: 2,
};

export const XElementClassSuffix = {
  [XElementType.SERVICE]: "Service",
  [XElementType.EVENT]: "Event",
  [XElementType.EXCEPTION]: "Exception",
  [XElementType.LISTENER]: "Listener",
  [XElementType.COLLECTION]: "Collection",
  [XElementType.COLLECTION_MODEL]: "",
  [XElementType.GRAPHQL_INPUT_MODEL]: "Input",
  [XElementType.GRAPHQL_INPUT]: "",
  [XElementType.GRAPHQL_ENTITY]: "",
};
