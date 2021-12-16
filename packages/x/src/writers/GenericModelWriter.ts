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
import { GenericModelEnumWriter } from "./GenericModelEnumWriter";

export class GenericModelWriter extends BlueprintWriter {
  write(model: GenericModel, session: XSession) {
    const modelOperator = new FSOperator(session, model);
    const modelTpls = FSUtils.getTemplatePathCreator("model");

    if (!model.targetPath) {
      throw new Error(
        `You are using this generic writer without providing "targetPath" to the GenericModel`
      );
    }

    const enumWriter = this.getWriter(GenericModelEnumWriter);

    const modelDir = path.dirname(model.targetPath);
    // Inputs reflect other models enums should already be created
    // In input mode enums are re-used, so we do not have to rewrite them
    if (!model.reuseEnums) {
      model.enums.forEach((myEnum) => {
        enumWriter.write(
          {
            ...myEnum,
            enumFileSuffix: true,
            targetPath: path.join(modelDir, "enums"),
          },
          session
        );
      });
    }

    if (model.isBaseExtendMode) {
      const parts = model.targetPath.split(".");
      const basePath = parts.slice(0, -1).concat("base", "ts").join(".");
      modelOperator.sessionCopy(
        modelTpls("ts/model.extending.ts.tpl"),
        model.targetPath,
        { ignoreIfExists: true }
      );
      modelOperator.sessionCopy(modelTpls("ts/model.ts.tpl"), basePath);

      if (!model.isInputMode) {
        modelOperator.sessionPrependFile(
          model.targetPath,
          `export * from "./${model.localBaseName}";\n`
        );
      }
    } else {
      modelOperator.sessionCopy(modelTpls("ts/model.ts.tpl"), model.targetPath);
    }
  }
}
