import {
  BlueprintWriter,
  IBlueprintWriterSession,
} from "@bluelibs/terminal-bundle";
import { MicroserviceModel, CreateBundleModel, GenericModel } from "../models";
import { FSUtils } from "../utils/FSUtils";
import * as path from "path";
import { FSOperator } from "../utils/FSOperator";
import { CollectionModel } from "../models/CollectionModel";
import { GraphQLEntityWriter } from "./GraphQLEntityWriter";
import { GraphQLInputModel } from "../models/GraphQLInputModel";
import { ModelRaceEnum } from "../models/defs";
import { ServiceModel } from "../models/ServiceModel";
import { ServerRouteModel } from "../models/ServerRouteModel";
import { XSession } from "../utils/XSession";

export class ServerRouteWriter extends BlueprintWriter {
  write(model: ServerRouteModel, session: XSession) {
    const fsOperator = new FSOperator(session, model);

    const serverRouteTpls = fsOperator.getTemplatePathCreator("server-routes");
    const microserviceDir = session.getMicroservicePath();
    const serverRoutesDir = FSUtils.bundlePath(
      microserviceDir,
      model.bundleName,
      "server-routes"
    );

    fsOperator.sessionCopy(
      serverRouteTpls("route.ts.tpl"),
      path.join(serverRoutesDir, `${model.name}.route.ts`)
    );

    fsOperator.sessionAppendFile(
      path.join(serverRoutesDir, "index.ts"),
      `export * from "./${model.name}.route"`
    );
  }
}
