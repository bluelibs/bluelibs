import {
  BlueprintWriter,
  IBlueprintWriterSession,
} from "@bluelibs/terminal-bundle";
import { FSUtils } from "../utils/FSUtils";
import * as path from "path";
import { FSOperator } from "../utils/FSOperator";
import { CollectionLinkModel } from "../models/CollectionLinkModel";
import { ValidatorModel } from "../models/ValidatorModel";
import { YupFieldMap } from "../utils/ModelUtils";
import { XSession } from "../utils/XSession";

export class ValidatorWriter extends BlueprintWriter {
  write(model: ValidatorModel, session: XSession) {
    const microserviceDir = session.getMicroservicePath();
    const fsOperator = new FSOperator(session, model);
    const validatorTpls = FSUtils.getTemplatePathCreator("validator");

    const validatorsDir = FSUtils.bundlePath(
      microserviceDir,
      model.bundleName,
      "validators"
    );

    fsOperator.sessionCopy(
      validatorTpls("validator.ts.tpl"),
      path.join(validatorsDir, model.validatorNameUpper + ".validator.ts")
    );

    fsOperator.sessionCopy(
      validatorTpls("declarations.d.ts.tpl"),
      path.join(validatorsDir, model.validatorClassName + ".declarations.ts")
    );

    fsOperator.sessionAppendFile(
      path.join(validatorsDir, "index.ts"),
      `export * from "./{{ validatorNameUpper }}.validator"`
    );
  }
}
