import {
  BlueprintWriter,
  IBlueprintWriterSession,
} from "@bluelibs/terminal-bundle";
import { FSUtils } from "../utils/FSUtils";
import * as path from "path";
import { FSOperator } from "../utils/FSOperator";
import { ExceptionModel } from "../models/ExceptionModel";
import { XSession } from "../utils/XSession";

export class ExceptionWriter extends BlueprintWriter {
  write(model: ExceptionModel, session: XSession) {
    const fsOperator = new FSOperator(session, model);

    const serviceTpls = fsOperator.getTemplatePathCreator("exception");
    const microserviceDir = session.getMicroservicePath();
    const exceptionsDir = FSUtils.bundlePath(
      microserviceDir,
      model.bundleName,
      "exceptions"
    );

    fsOperator.sessionCopy(
      serviceTpls("exception.ts.tpl"),
      path.join(exceptionsDir, `${model.exceptionName}.exception.ts`)
    );

    fsOperator.sessionAppendFile(
      path.join(exceptionsDir, "index.ts"),
      `export * from "./${model.exceptionName}.exception"`
    );
  }
}
