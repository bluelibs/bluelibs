import { BlueprintWriter } from "@bluelibs/terminal-bundle";
import { BlueprintCollectionModel } from "../models";
import { FSOperator, FSUtils, XSession } from "../utils";
import * as path from "path";

export class BlueprintCollectionWriter extends BlueprintWriter {
  write(model: BlueprintCollectionModel, session: XSession) {
    const fsOperator = new FSOperator(session, model);

    const blueprintTpls = fsOperator.getTemplatePathCreator("blueprint");

    const microserviceDir = session.getProjectPath();
    const collectionsDir = path.join(
      microserviceDir,
      "blueprint",
      "collections"
    );
    model.formattedCollections.forEach((collection) => {
      const localFsOperator = new FSOperator(session, {
        collection,
      });
      localFsOperator.sessionCopy(
        blueprintTpls("collection.ts.tpl"),
        path.join(collectionsDir, `${collection}.ts`),
        {
          ignoreIfExists: true,
        }
      );
      localFsOperator.sessionAppendFile(
        path.join(collectionsDir, "index.ts"),
        `export * from "./${collection}"`
      );
    });
  }
}
