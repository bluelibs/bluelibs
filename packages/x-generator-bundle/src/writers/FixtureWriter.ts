import {
  BlueprintWriter,
  IBlueprintWriterSession,
} from "@bluelibs/terminal-bundle";
import { FSUtils } from "../utils/FSUtils";
import * as path from "path";
import { FSOperator } from "../utils/FSOperator";
import { FixtureModel } from "../models/FixtureModel";
import { XSession } from "../utils/XSession";

export class FixtureWriter extends BlueprintWriter {
  write(model: FixtureModel, session: XSession) {
    const microserviceDir = session.getMicroservicePath();
    const fsOperator = new FSOperator(session, model);
    const fixtureTpls = FSUtils.getTemplatePathCreator("fixture");

    const fixturesDir = FSUtils.bundlePath(
      microserviceDir,
      model.bundleName,
      "fixtures"
    );

    const fixtureTargetPath = path.join(
      fixturesDir,
      `${model.fixtureName}.fixture.ts`
    );
    model.targetPath = fixtureTargetPath;

    if (model.dataMapMode === true) {
      fsOperator.sessionCopy(
        fixtureTpls("fixture.dataMap.ts.tpl"),
        path.join(fixturesDir, `${model.fixtureName}.fixture.ts`),
        { ignoreIfExists: true }
      );
      fsOperator.sessionCopy(
        fixtureTpls("dataMap.ts.tpl"),
        path.join(fixturesDir, `${model.fixtureName}.dataMap.ts`)
      );
    } else {
      fsOperator.sessionCopy(
        fixtureTpls("fixture.ts.tpl"),
        path.join(fixturesDir, `${model.fixtureName}.fixture.ts`)
      );
    }

    fsOperator.sessionAppendFile(
      path.join(fixturesDir, "index.ts"),
      `export * from "./${model.fixtureName}.fixture"`
    );
  }
}
