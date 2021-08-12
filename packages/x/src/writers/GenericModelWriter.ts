import {
  BlueprintWriter,
  IBlueprintWriterSession,
} from "@bluelibs/terminal-bundle";
import { MicroserviceModel, CreateBundleModel, GenericModel } from "../models";
import { FSUtils } from "../utils/FSUtils";
import * as path from "path";
import { FSOperator } from "../utils/FSOperator";
import { CollectionModel } from "../models/CollectionModel";
import { XSession } from "../utils/XSession";

export class GenericModelWriter extends BlueprintWriter {
  write(model: GenericModel, session: XSession) {
    const modelOperator = new FSOperator(session, model);
    const modelTpls = FSUtils.getTemplatePathCreator("model");

    if (!model.targetPath) {
      throw new Error(
        `You are using this generic writer without providing "targetPath" to the GenericModel`
      );
    }

    const modelDir = path.dirname(model.targetPath);
    // Inputs reflect other models enums should already be created
    // In input mode enums are re-used, so we do not have to rewrite them
    if (!model.reuseEnums) {
      model.enums.forEach((myEnum) => {
        const enumOperator = new FSOperator(session, myEnum);

        enumOperator.sessionCopy(
          modelTpls("ts/enum.ts.tpl"),
          path.join(modelDir, "enums", `${myEnum.className}.enum.ts`)
        );
      });
    }

    if (model.isBaseExtendMode) {
      const parts = model.targetPath.split(".");
      const basePath = parts.slice(0, -1).concat("base", "ts").join(".");
      modelOperator.sessionCopy(
        modelTpls("ts/model.extending.ts.tpl"),
        model.targetPath
      );
      modelOperator.sessionCopy(modelTpls("ts/model.ts.tpl"), basePath);
    } else {
      modelOperator.sessionCopy(modelTpls("ts/model.ts.tpl"), model.targetPath);
    }
  }
}
