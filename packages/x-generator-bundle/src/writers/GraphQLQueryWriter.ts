import {
  BlueprintWriter,
  IBlueprintWriterSession,
} from "@bluelibs/terminal-bundle";
import { FSUtils } from "../utils/FSUtils";
import * as path from "path";
import { FSOperator } from "../utils/FSOperator";
import { GraphQLQueryModel } from "../models/GraphQLQueryModel";
import { GraphQLInputModel } from "../models/GraphQLInputModel";
import { GraphQLInputWriter } from "./GraphQLInputWriter";
import { XElements, XElementType } from "../utils/XElements";
import { XSession } from "../utils/XSession";

export class GraphQLQueryWriter extends BlueprintWriter {
  write(model: GraphQLQueryModel, session: XSession) {
    const microserviceDir = session.getMicroservicePath();
    const bundlePath = FSUtils.bundlePath(microserviceDir, model.bundleName);
    const fsOperator = new FSOperator(session, model);

    const graphqlTpls = fsOperator.getTemplatePathCreator("graphql");

    const resolverTargetPath = path.join(
      bundlePath,
      "graphql",
      "queries",
      model.queryName,
      model.queryName + ".resolvers.ts"
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

    fsOperator.sessionCopy(
      graphqlTpls("query.graphql.ts.tpl"),
      path.join(
        bundlePath,
        "graphql",
        "queries",
        model.queryName,
        `${model.queryName}.graphql.ts`
      )
    );

    fsOperator.sessionCopy(
      graphqlTpls("query.resolvers.ts.tpl"),
      resolverTargetPath
    );
  }
}
