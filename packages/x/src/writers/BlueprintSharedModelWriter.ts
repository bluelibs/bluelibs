import { BlueprintWriter } from "@bluelibs/terminal-bundle";
import { BlueprintSharedModelModel } from "../models";
import { FSOperator, FSUtils, XSession } from "../utils";
import * as path from "path";

export class BlueprintSharedModelWriter extends BlueprintWriter {
  write(model: BlueprintSharedModelModel, session: XSession) {
    const fsOperator = new FSOperator(session, model);

    const blueprintTpls = fsOperator.getTemplatePathCreator("blueprint");

    const microserviceDir = session.getProjectPath();
    const sharedModelsDir = path.join(
      microserviceDir,
      "blueprint",
      "shared-models"
    );

    model.formattedNames.forEach((sharedModel) => {
      const localFsOperator = new FSOperator(session, {
        name: sharedModel,
      });
      localFsOperator.sessionCopy(
        blueprintTpls("sharedModel.ts.tpl"),
        path.join(sharedModelsDir, `${sharedModel}.ts`),
        {
          ignoreIfExists: true,
        }
      );
      localFsOperator.sessionAppendFile(
        path.join(sharedModelsDir, "index.ts"),
        `export * from "./${sharedModel}"`
      );
    });
  }
}
