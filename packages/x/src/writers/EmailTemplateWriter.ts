import { BlueprintWriter } from "@bluelibs/terminal-bundle";
import { EmailTemplateModel } from "../models/EmailTemplateModel";
import { FSOperator, FSUtils, XSession } from "../utils";
import * as path from "path";

export class EmailTemplateWriter extends BlueprintWriter {
  write(model: EmailTemplateModel, session: XSession) {
    const fsOperator = new FSOperator(session, model);

    const serviceTpls = fsOperator.getTemplatePathCreator("email");

    const microserviceDir = session.getMicroservicePath();
    const emailsDir = FSUtils.bundlePath(
      microserviceDir,
      model.bundleName,
      "emails"
    );

    fsOperator.sessionCopy(
      serviceTpls("email.ts.tpl"),
      path.join(emailsDir, `${model.emailName}.email.tsx`)
    );

    fsOperator.sessionAppendFile(
      path.join(emailsDir, "index.ts"),
      `export * from "./{{ emailName }}.email"`
    );
  }
}
