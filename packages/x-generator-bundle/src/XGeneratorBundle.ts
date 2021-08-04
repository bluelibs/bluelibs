import {
  TerminalBundle,
  CommanderService,
  chalk,
} from "@bluelibs/terminal-bundle";
import { Bundle } from "@bluelibs/core";
import commands from "./commands";
import { execSync } from "child_process";
import { GENERATOR_QUOTES } from "./constants";
import { IXGeneratorBundleConfig } from "./defs";

export class XGeneratorBundle extends Bundle<IXGeneratorBundleConfig> {
  dependencies = [TerminalBundle];

  defaultConfig: IXGeneratorBundleConfig = {
    supressInitialisation: false,
  };

  async init() {
    const service = this.get<CommanderService>(CommanderService);

    if (!this.config.supressInitialisation) {
      commands.forEach((command) => {
        service.registerCommand(command);
      });

      this.displayWelcomeMessage();
    }
  }

  public displayWelcomeMessage() {
    console.log(chalk.yellowBright(`${X_WAY}`));

    const logoLength = X_WAY.split("\n")[1].length;
    const message =
      GENERATOR_QUOTES[Math.floor(Math.random() * GENERATOR_QUOTES.length)];

    console.log(
      " ".repeat(logoLength / 2 - message.length / 2) +
        chalk.green.bold(message)
    );
    console.log("");
  }
}

// This is a mechanism to check for the latest version
const packageVersion = require("../package.json").version;

let latestVersion;
let showUpdateInstructions = false;

try {
  const result = execSync("npm view @bluelibs/x version", {
    timeout: 1000,
  });
  latestVersion = result.toString().split("\n")[0];

  if (packageVersion !== latestVersion) {
    showUpdateInstructions = true;
  }
} catch (e) {}

const X_WAY = String.raw`
___   ___      ____    __    ____  ___   ____    ____ 
\  \ /  /      \   \  /  \  /   / /   \  \   \  /   / 
 \  V  /   _____\   \/    \/   / /  ^  \  \   \/   /  
  >   <   |______\            / /  /_\  \  \_    _/   
 /  .  \          \    /\    / /  _____  \   |  |     
/__/ \__\          \__/  \__/ /__/     \__\  |__|
${
  showUpdateInstructions
    ? `New version available (${latestVersion})\nnpm i -g @bluelibs/x`
    : ""
}    
`;
