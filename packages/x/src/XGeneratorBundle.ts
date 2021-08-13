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
      this.checkAndDisplayNewVersion();
    }
  }

  public async checkAndDisplayNewVersion() {
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

    if (showUpdateInstructions) {
      console.log(`Newer version available (${latestVersion})`);
      console.log("");
    }
  }

  public displayWelcomeMessage() {
    console.log(chalk.blueBright.bold(`${X_FRAMEWORK_LOGO}`));
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

const X_FRAMEWORK_LOGO = String.raw`
xxxxxxx      xxxxxxx
 x:::::x    x:::::x 
  x:::::x  x:::::x  
   x:::::xx:::::x   
    x::::::::::x    
     x::::::::x     X-Framework CLI by BlueLibs
     x::::::::x     ${chalk.green.bold("You are in control.")}
    x::::::::::x    
   x:::::xx:::::x   
  x:::::x  x:::::x  
 x:::::x    x:::::x 
xxxxxxx      xxxxxxx 
`;
