import {
  BlueprintWriter,
  IBlueprintWriterSession,
} from "@bluelibs/terminal-bundle";
import { ProjectModel } from "../models";
import { FSOperator } from "../utils/FSOperator";
import { XSession } from "../utils/XSession";

export class ProjectWriter extends BlueprintWriter {
  write(model: ProjectModel, session: XSession) {
    const fsOperator = new FSOperator(session, model);
    const tpl = fsOperator.getTemplatePathCreator("/project");

    fsOperator.sessionCopy(tpl(), `${model.name}`);
  }
}
