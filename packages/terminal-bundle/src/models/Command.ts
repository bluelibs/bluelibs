import { Inject, Service } from "@bluelibs/core";
import { PrompterService } from "../services/PrompterService";
import { CommanderService } from "../services/CommanderService";
import { IExecutor } from "../defs";

// TODO:
// @ts-expect-error - abstract class with decorator for DI
@Service()
export abstract class Command<T = unknown> implements IExecutor<T> {
  @Inject(() => PrompterService)
  prompter: PrompterService;
  @Inject(() => CommanderService)
  commander: CommanderService;

  /**
   * Return the name of the command "{namespace}:{module}:{action}" or just "{module}:{action}"
   * An example would be "app:mongodb:drop-database"
   */
  abstract getName(): string;

  abstract execute(model: T): Promise<void>; // The promise of the void.

  async init() {
    this.commander.registerCommand({
      id: this.getName(),
      execute: (model) => this.execute(model),
    });
  }
}
