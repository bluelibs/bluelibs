import { BlueprintWriter } from "@bluelibs/terminal-bundle";
import { ServerlessConfigModel } from "../models";
import { FSOperator, FSUtils, XSession } from "../utils";
import * as path from "path";

export class ServerlessConfigWriter extends BlueprintWriter {
  write(model: ServerlessConfigModel, session: XSession) {
    const fsOperator = new FSOperator(session, model);

    const serverlessTpls = fsOperator.getTemplatePathCreator("serverless");
    const apiMicroservicePath = path.join(
      session.getProjectPath(),
      "microservices",
      "api"
    );

    const localFsOperator = new FSOperator(session, model);

    localFsOperator.sessionCopy(
      serverlessTpls("serverless.yml.tpl"),
      path.join(apiMicroservicePath, "serverless.yml")
    );
    localFsOperator.sessionCopy(
      serverlessTpls("ServerlessHandler.ts.tpl"),
      path.join(apiMicroservicePath, "src", "startup", "ServerlessHandler.ts")
    );
  }
}
