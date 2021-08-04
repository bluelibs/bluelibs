import { Bundle, EventManager, KernelAfterInitEvent } from "@bluelibs/core";
import { Command as CommanderCommand } from "commander";
import { CommanderService } from "./services/CommanderService";
import { ITerminalBundleConfig } from "./defs";
import * as InquirerSearchList from "inquirer-search-list";
import * as InquirerAutocomplete from "inquirer-autocomplete-prompt";
import * as inquirer from "inquirer";
import { TERMINAL_BUNDLE_OPTIONS } from "./constants";

export class TerminalBundle extends Bundle<ITerminalBundleConfig> {
  async hook() {
    const eventManager = this.container.get<EventManager>(EventManager);

    eventManager.addListener(KernelAfterInitEvent, async () => {
      const program = new CommanderCommand();
      const commanderService = this.container.get<CommanderService>(
        CommanderService
      );

      // Interesting why I have to do "as", no time to debug, fix later
      commanderService.init(program as CommanderCommand);
    });
  }

  async prepare() {
    const { commands } = this.config;
    this.container.set(TERMINAL_BUNDLE_OPTIONS, this.config);

    if (commands) {
      const commanderService = this.container.get<CommanderService>(
        CommanderService
      );

      commands.forEach((command) => {
        commanderService.registerCommand(command);
      });
    }

    inquirer.registerPrompt("autocomplete", InquirerAutocomplete);
    inquirer.registerPrompt("search-list", InquirerSearchList);
  }
}
