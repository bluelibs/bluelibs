import {
  BlueprintWriter,
  IBlueprintWriterSession,
} from "@bluelibs/terminal-bundle";
import { FSUtils } from "../utils/FSUtils";
import * as path from "path";
import { FSOperator } from "../utils/FSOperator";
import { XSession } from "../utils/XSession";
import * as fs from "fs";
import { CollectionReducerModel } from "../models";

export class CollectionReducerWriter extends BlueprintWriter {
  write(model: CollectionReducerModel, session: XSession) {
    const microserviceDir = session.getMicroservicePath();
    const fsOperator = new FSOperator(session, model);

    if (!model.dependency) {
      model.dependency = {};
    }

    const collectionsDir = FSUtils.bundlePath(
      microserviceDir,
      model.bundleName,
      "collections"
    );
    const reducerFilePath = path.join(
      collectionsDir,
      model.collectionName,
      model.collectionName + ".reducers.ts"
    );

    const eligibleForAdding =
      fs
        .readFileSync(reducerFilePath)
        .toString()
        .indexOf(`export const ${model.name}`) === -1;

    if (eligibleForAdding) {
      fsOperator.sessionAppendFile(
        reducerFilePath,
        `
        export const ${model.name}:IReducerOption = {
          dependency: ${JSON.stringify(model.dependency)},
          async reduce(parent, { context }) {
            // You can access the container via: context.container
            return "Not Implemented";
          }
        }`
      );
    }

    session.afterCommitInstruction(() => {
      console.log(
        `\nPlease ensure that your database model files and GraphQL types are updated accordingly.\n`
      );
    });
  }
}
