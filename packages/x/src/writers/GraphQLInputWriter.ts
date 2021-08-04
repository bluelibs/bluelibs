import {
  BlueprintWriter,
  IBlueprintWriterSession,
} from "@bluelibs/terminal-bundle";
import { FSUtils } from "../utils/FSUtils";
import * as path from "path";
import { FSOperator } from "../utils/FSOperator";
import { GraphQLInputModel } from "../models/GraphQLInputModel";
import { ModelRaceEnum, GenericFieldTypeEnum } from "../models/defs";
import { XSession } from "../utils/XSession";
import { GenericModelWriter } from "./GenericModelWriter";
import { GenericModel } from "../models";

export class GraphQLInputWriter extends BlueprintWriter {
  write(model: GraphQLInputModel, session: XSession) {
    const fsOperator = new FSOperator(session, model.genericModel);

    const microserviceDir = session.getMicroservicePath();
    const bundlePath = FSUtils.bundlePath(microserviceDir, model.bundleName);
    const tpl = fsOperator.getTemplatePathCreator("model");

    const genericModel = model.genericModel;
    genericModel.race = ModelRaceEnum.GRAPHQL_INPUT;
    genericModel.yupValidation = true;

    if (genericModel.fields.length === 0) {
      // GraphQL will fail to parse the type without any field
      genericModel.fields.push({
        isMany: false,
        isOptional: true,
        name: "example",
        type: GenericFieldTypeEnum.STRING,
      });
    }

    fsOperator.sessionCopy(
      tpl("graphql/input.graphql.ts.tpl"),
      path.join(
        bundlePath,
        "graphql",
        "inputs",
        genericModel.modelClass + ".graphql.ts"
      )
    );

    const tsModel = GenericModel.clone(genericModel);
    tsModel.isInputMode = true;
    tsModel.targetPath = path.join(
      bundlePath,
      "services",
      "inputs",
      genericModel.modelName + ".input.ts"
    );
    this.getWriter(GenericModelWriter).write(tsModel, session);
    // fsOperator.sessionCopy(
    //   tpl("ts/model.ts.tpl"),
    //   path.join(
    //     bundlePath,
    //     "services",
    //     "inputs",
    //     genericModel.modelName + ".input.ts"
    //   )
    // );

    fsOperator.sessionAppendFile(
      path.join(bundlePath, "services", "inputs", "index.ts"),
      `export * from "./${genericModel.modelName + ".input"}";`
    );
  }
}
