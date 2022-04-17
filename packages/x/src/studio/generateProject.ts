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
  //read argvs
  const newParams = readArgvs(studioApp, options);
  studioApp = newParams.studioApp;
  options = newParams.options;

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

function readArgvs(studioApp, options) {
  const args = process.argv.slice(2);
  const skip: string[] = args
    .find((arg) => arg.includes("skip"))
    ?.split("=")[1]
    ?.split(",");
  if (skip?.length) studioApp.skip = skip;
  const only: string[] = args
    .find((arg) => arg.includes("only"))
    ?.split("=")[1]
    ?.split(",");
  if (only?.length) studioApp.only = only;

  const override: string = args
    .find((arg) => arg.includes("skip"))
    ?.split("=")[1];
  if (override) {
    options.override = override.toLocaleLowerCase() === "true";
  }
  return { studioApp, options };
}
