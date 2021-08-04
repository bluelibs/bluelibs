import {
  BlueprintWriter,
  IBlueprintWriterSession,
} from "@bluelibs/terminal-bundle";
import { FSUtils } from "../utils/FSUtils";
import * as path from "path";
import { FSOperator } from "../utils/FSOperator";
import { GraphQLInputModel } from "../models/GraphQLInputModel";
import { ModelRaceEnum, GenericFieldTypeEnum } from "../models/defs";
import { GenericModel } from "../models";
import { GraphQLMutationModel } from "../models/GraphQLMutationModel";
import { GraphQLInputWriter } from "./GraphQLInputWriter";
import { XElements, XElementType } from "../utils/XElements";
import { XSession } from "../utils/XSession";

export class GraphQLMutationWriter extends BlueprintWriter {
  write(model: GraphQLMutationModel, session: XSession) {
    const microserviceDir = session.getMicroservicePath();
    const bundlePath = FSUtils.bundlePath(microserviceDir, model.bundleName);
    const fsOperator = new FSOperator(session, model);

    const graphqlTpls = fsOperator.getTemplatePathCreator("graphql");
    const resolverTargetPath = path.join(
      bundlePath,
      "graphql",
      "mutations",
      model.mutationName,
      model.mutationName + ".resolvers.ts"
    );

    model.resolverTargetPath = resolverTargetPath;

    // Ensure we write the input if it does not exist yet
    if (model.hasInput && !model.inputAlreadyExists) {
      const graphqlInputModel = new GraphQLInputModel();
      graphqlInputModel.bundleName = model.bundleName;
      graphqlInputModel.genericModel = model.inputModel;

      this.getWriter(GraphQLInputWriter).write(graphqlInputModel, session);

      model.inputElement = XElements.createXElementResult(
        XElements.getRelativeInputPath(graphqlInputModel.genericModel.name), // file path
        XElementType.GRAPHQL_INPUT_MODEL,
        model.bundleName,
        bundlePath
      );
    }

    // Extend the graphql types from mutations/index.graphql
    fsOperator.sessionCopy(
      graphqlTpls("mutation.graphql.ts.tpl"),
      path.join(
        bundlePath,
        "graphql",
        "mutations",
        model.mutationName,
        `${model.mutationName}.graphql.ts`
      )
    );

    fsOperator.sessionCopy(
      graphqlTpls("mutation.resolvers.ts.tpl"),
      resolverTargetPath
    );
  }
}
