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
import { UnitTestModel } from "../models/UnitTestModel";
import { XElements, XElementType } from "../utils/XElements";
import { UnitTestWriter } from "./UnitTestWriter";
import { XSession } from "../utils/XSession";

export class ServiceWriter extends BlueprintWriter {
  write(model: ServiceModel, session: XSession) {
    const fsOperator = new FSOperator(session, model);

    const serviceTpls = fsOperator.getTemplatePathCreator("service");
    const microserviceDir = session.getMicroservicePath();
    const bundlePath = FSUtils.bundlePath(microserviceDir, model.bundleName);
    const servicesDir = path.join(bundlePath, "services");

    const servicePath = path.join(
      servicesDir,
      `${model.serviceName}.service.ts`
    );
    fsOperator.sessionCopy(serviceTpls("service.ts.tpl"), servicePath);

    fsOperator.sessionAppendFile(
      path.join(servicesDir, "index.ts"),
      `export * from "./${model.serviceName}.service"`
    );

    const unitTestModel = this.createUnitTestModel(model, microserviceDir);

    this.getWriter(UnitTestWriter).write(unitTestModel, session);
    fsOperator.sessionPrependFile(
      path.join(bundlePath, "__tests__", "index.ts"),
      `import "./${model.serviceName}.service.test.ts";\n`
    );
  }

  protected createUnitTestModel(model: ServiceModel, microserviceDir: any) {
    const unitTestModel = new UnitTestModel();
    unitTestModel.bundleName = model.bundleName;
    unitTestModel.element = XElements.createXElementResult(
      path.join("services", `${model.serviceName}.service.ts`),
      XElementType.SERVICE,
      model.bundleName,
      FSUtils.bundlePath(microserviceDir, model.bundleName)
    );

    unitTestModel.methodNames = model.methodsArray.concat([]);

    return unitTestModel;
  }
}
