import * as path from "path";
import { XSession, FSOperator, FSUtils } from "../";
import { BlueprintWriter } from "@bluelibs/terminal-bundle";
import { UICollectionModel } from "../models/UICollectionModel";

export class UICollectionWriter extends BlueprintWriter {
  write(model: UICollectionModel, session: XSession) {
    const fsOperator = new FSOperator(session, model);
    const microserviceDir = session.getMicroservicePath();
    const tpl = fsOperator.getTemplatePathCreator("blueprint");

    const collectionsDir = FSUtils.bundlePath(
      microserviceDir,
      model.bundleName,
      "collections"
    );

    fsOperator.sessionCopy(
      tpl("ui/collections/collection.ts.tpl"),
      path.join(
        collectionsDir,
        model.collectionName,
        `${model.collectionName}.collection.ts`
      )
    );

    fsOperator.sessionAppendFile(
      path.join(collectionsDir, model.collectionName, "index.ts"),
      `export * from "./${model.collectionName}.collection"`
    );

    fsOperator.sessionAppendFile(
      path.join(collectionsDir, "index.ts"),
      `export * from "./${model.collectionName}"`
    );
  }
}
