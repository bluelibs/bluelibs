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

type GraphQLEnumModelType = {
  className: string;
  elements: EnumConfigType[];
  description?: string;
  targetPath?: string;
};

export class GraphQLEnumWriter extends BlueprintWriter {
  write(model: GraphQLEnumModelType, session: XSession) {
    const enumOperator = new FSOperator(session, model);
    const modelTpls = FSUtils.getTemplatePathCreator("model");

    enumOperator.sessionCopy(
      modelTpls("graphql/enum.graphql.ts.tpl"),
      path.join(model.targetPath, `${model.className}.graphql.ts`)
    );

    enumOperator.sessionCopy(
      modelTpls("graphql/enum.resolvers.ts.tpl"),
      path.join(model.targetPath, `${model.className}.resolvers.ts`)
    );
  }
}
