import {
  BlueprintWriter,
  IBlueprintWriterSession,
} from "@bluelibs/terminal-bundle";
import { MicroserviceModel, CreateBundleModel } from "../models";
import { FSUtils } from "../utils/FSUtils";
import * as path from "path";
import { FSOperator } from "../utils/FSOperator";
import { XSession } from "../utils/XSession";

export class CreateBundleWriter extends BlueprintWriter {
  write(model: CreateBundleModel, session: XSession) {
    const microserviceDir = session.getMicroservicePath();
    writeNewBundle(session, model, microserviceDir);
  }
}

export function writeNewBundle(
  session: XSession,
  model: CreateBundleModel,
  microserviceDir: any
) {
  const fsOperator = new FSOperator(session, model);

  const tpl = fsOperator.getTemplatePathCreator("bundle");

  const bundlePath = path.join(
    microserviceDir,
    "src",
    "bundles",
    model.bundleClass
  );

  fsOperator.sessionCopy(tpl("create"), bundlePath, { ignoreIfExists: true });

  if (model.containsGraphQL) {
    fsOperator.sessionCopy(tpl("graphql"), path.join(bundlePath, "graphql"), {
      ignoreIfExists: true,
    });
  }

  if (model.containsServerRoutes) {
    fsOperator.sessionCopy(
      tpl("server-routes"),
      path.join(bundlePath, "server-routes"),
      { ignoreIfExists: true }
    );
  }

  fsOperator.sessionAppendFile(
    path.join(bundlePath, "index.ts"),
    `export * from "./{{ bundleClass }}"`
  );

  fsOperator.sessionAppendFile(
    path.join(microserviceDir, "src", "bundles", "index.ts"),
    `export * from "./{{ bundleClass }}"`
  );

  fsOperator.sessionWrite(
    path.join(
      microserviceDir,
      "src",
      "startup",
      "bundles",
      `${model.bundleName}.ts`
    ),
    `import { {{ bundleClass }} } from "../../bundles";
       import { kernel } from '../kernel'; 

       kernel.addBundle(new {{ bundleClass}}());`
  );

  fsOperator.sessionAppendFile(
    path.join(microserviceDir, "src", "startup", "bundles", "index.ts"),
    `import "./{{ bundleName }}"`
  );

  session.afterCommitInstruction(() => {
    console.log(`Bundle "${model.bundleName}" has been created.`);
  });
}
