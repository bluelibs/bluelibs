import { Kernel } from "@bluelibs/core";
import { TerminalBundle } from "@bluelibs/terminal-bundle";
import * as Studio from "./models";
import { XSession } from "../utils";
import { StudioWriter } from "./StudioWriter";
import { GenerateProjectOptionsType, ALL_GENERATORS } from "./defs";
import { SanityChecker } from "./bridge/SanityChecker";

const kernel = new Kernel({
  bundles: [
    // new TerminalBundle({
    //   version: require("../../package.json").version,
    // }),
  ],
});

export async function generateProject(
  studioApp: Studio.App,
  options?: Partial<GenerateProjectOptionsType>
) {
  // Warning if git has things to commit, to encourage new stuff

  studioApp.clean();
  const checker = new SanityChecker(studioApp);
  checker.check();

  console.log("Starting generating project: ", studioApp.id);
  await kernel.init();
  const writer = new StudioWriter(kernel.container, studioApp, options);

  try {
    await writer.write();
    await writer.session.commit();

    writer.success("Successfully generated the project");
  } catch (e) {
    console.error(`Something went wrong with the generation:`);
    console.error(e);
  }
}
