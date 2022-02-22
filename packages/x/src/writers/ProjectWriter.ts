import {
  BlueprintWriter,
  IBlueprintWriterSession,
} from "@bluelibs/terminal-bundle";
import { execSync, spawnSync } from "child_process";
import { ProjectModel } from "../models";
import { FSOperator } from "../utils/FSOperator";
import { XSession } from "../utils/XSession";
import chalk from "chalk";
import * as os from "os";

export class ProjectWriter extends BlueprintWriter {
  write(model: ProjectModel, session: XSession) {
    const platform = os.platform();

    const fsOperator = new FSOperator(session, model);
    const tpl = fsOperator.getTemplatePathCreator("/project");

    fsOperator.sessionCopy(tpl(), `${model.name}`);

    session.afterCommit(async () => {
      // npm install
      console.log("");
      console.log(
        `${chalk.redBright("♦")} Installing project npm dependencies...`
      );
      execSync(
        `cd ${model.name} ${platform == "win32" ? "&&" : ";"} npm install`
      );
      console.log("");
      console.log("Next step, generate the blueprint!");
      console.log("");
      console.log(`$ cd ${model.name}`);
      console.log(`$ npm run blueprint:generate`);

      console.log("");
      console.log(
        `${chalk.greenBright("✓")} Completed project initialisation.`
      );
      console.log("");
    });
  }
}
