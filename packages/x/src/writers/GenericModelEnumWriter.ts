import {
  BlueprintWriter,
  IBlueprintWriterSession,
} from "@bluelibs/terminal-bundle";
import {
  MicroserviceModel,
  CreateBundleModel,
  GenericModel,
  EnumConfigExtractResult,
  EnumConfigType,
} from "../models";
import { FSUtils } from "../utils/FSUtils";
import * as path from "path";
import { FSOperator } from "../utils/FSOperator";
import { CollectionModel } from "../models/CollectionModel";
import { XSession } from "../utils/XSession";

type GenericModelEnumType = {
  className: string;
  elements: EnumConfigType[];
  targetPath: string;
  enumFileSuffix?: boolean;
};

export class GenericModelEnumWriter extends BlueprintWriter {
  write(model: GenericModelEnumType, session: XSession) {
    const enumOperator = new FSOperator(session, model);
    const modelTpls = FSUtils.getTemplatePathCreator("model");

    enumOperator.sessionCopy(
      modelTpls("ts/enum.ts.tpl"),
      path.join(
        model.targetPath,
        `${model.className}${model.enumFileSuffix ? ".enum" : ""}.ts`
      )
    );
  }
}
