import {
  ICommandService,
  ICommand,
  ICommandRunOptions,
  IInquirer,
  IBlueprintWriter,
  IBlueprintWriterSession,
  IExecutor,
} from "../defs";
import { ContainerInstance, Inject, EventManager } from "@bluelibs/core";
import { BlueprintWriterSession } from "../models/BlueprintWriterSession";
import { PrompterService } from "./PrompterService";
import { Command as CommanderCommand } from "commander";
import { Shortcuts } from "./Shortcuts";
import { ITerminalBundleConfig } from "../defs";
import { TERMINAL_BUNDLE_OPTIONS } from "../constants";
import {
  BeforeExecutionEvent,
  AfterExecutionEvent,
  BeforeCommandRunEvent,
  BeforeProgramParseEvent,
  AfterProgramParseEvent,
} from "../events";
import {
  BeforeInquiryEvent,
  AfterInquiryEvent,
  BeforeBlueprintWriteEvent,
  AfterBlueprintWriteEvent,
} from "../events";

const SEPARATOR = ":";

export class CommanderService implements ICommandService {
  protected readonly prompter: PrompterService;
  protected program: CommanderCommand;

  constructor(
    protected readonly container: ContainerInstance,
    protected readonly eventManager: EventManager,
    @Inject(TERMINAL_BUNDLE_OPTIONS)
    protected readonly config: ITerminalBundleConfig
  ) {
    this.prompter = container.get(PrompterService);
  }

  protected commands: ICommand[] = [];

  async init(program: CommanderCommand) {
    this.program = program;

    // Either it was set via the tenant bundle
    program.version(
      this.config.version || require("../../package.json").version
    );

    this.setupRunCommand(program);
    this.setupDescribeCommand(program);
    this.setupListCommand(program);

    await this.eventManager.emit(new BeforeProgramParseEvent({ program }));

    if (process.argv.length === 2) {
      this.inquire();
    } else {
      program.parse(process.argv);
      await this.eventManager.emit(new AfterProgramParseEvent({ program }));
    }
  }

  registerCommand(command: ICommand) {
    if (this.getCommand(command.id)) {
      throw new Error(
        `Another command with the same id (${command.id}) is already registered.`
      );
    }

    this.commands.push(command);
  }

  getCommands(): ICommand[] {
    return this.commands;
  }

  getCommand(id: string): ICommand {
    return this.commands.find((command) => {
      return command.id === id;
    });
  }

  async inquire(): Promise<void> {
    const commandId = await this.prompter.prompt(
      Shortcuts.autocomplete(
        "Choose a command",
        this.commands.map((c) => c.id)
      )
    );

    await this.run(this.getCommand(commandId));

    const again = await this.prompter.prompt(
      Shortcuts.confirm("Run another command?")
    );

    if (again) {
      this.inquire();
    }
  }

  async run(command: ICommand, options?: ICommandRunOptions): Promise<void> {
    let model = options?.model || {};

    await this.eventManager.emit(new BeforeCommandRunEvent({ command }));

    if (command.inquirer) {
      // Transient
      const inquirer = this.container.get<IInquirer>(command.inquirer);
      // We extend the inquiry model in case there are extra stuff
      Object.assign(inquirer.model, model);

      const eventData = {
        command,
        inquirer,
      };

      await this.eventManager.emit(new BeforeInquiryEvent(eventData));

      // Now model reflects the reference of the inquirer one
      model = inquirer.model;

      await inquirer.inquire();
      await this.eventManager.emit(new AfterInquiryEvent(eventData));
    }

    if (command.writer) {
      const writer = this.container.get<IBlueprintWriter>(command.writer);
      let writerSession;

      if (command.sessionFactory) {
        writerSession = command.sessionFactory.call(null, this.container);
      } else {
        writerSession = this.container.get(BlueprintWriterSession);
      }

      const eventData = {
        command,
        writer,
        writerSession,
      };

      await this.eventManager.emit(new BeforeBlueprintWriteEvent(eventData));

      await writer.write(model, writerSession);

      await this.awaitAffectedPathsConfirmationAndCommit(writerSession);

      await this.eventManager.emit(new AfterBlueprintWriteEvent(eventData));
    }

    if (command.executor) {
      const executor = this.container.get<IExecutor>(command.executor);
      const eventData = {
        command,
        executor,
      };

      await this.eventManager.emit(new BeforeExecutionEvent(eventData));

      await executor.execute(model);

      await this.eventManager.emit(new AfterExecutionEvent(eventData));
    }

    await this.eventManager.emit(new BeforeCommandRunEvent({ command }));
  }

  /**
   * Ask if paths are ok and commit
   */
  public async awaitAffectedPathsConfirmationAndCommit(
    writerSession: IBlueprintWriterSession
  ) {
    let allAffectedPaths = writerSession
      .getAllAffectedPaths(true)
      .map((path) => {
        if (path.startsWith("/")) {
          return path.slice(1);
        }
        return path;
      });

    // uniqueness
    allAffectedPaths = Array.from(new Set(allAffectedPaths));
    if (allAffectedPaths.length) {
      const toCommit = await this.prompter.prompt(
        Shortcuts.confirm(
          "\nThe following paths will be affected: \n\n" +
            allAffectedPaths.join("\n") +
            "\n\nApply changes to the files above?"
        )
      );
      if (toCommit) {
        await writerSession.commit();
      }
    } else {
      console.log("\nNo files have been changed.\n");
    }
  }

  protected setupListCommand(program: CommanderCommand) {
    program
      .command("list")
      .description("List all available commands")
      .action(() => {
        if (this.commands.length === 0) {
          console.log("No commands found.");
          return;
        }
        this.commands.forEach((command) => {
          console.log({
            id: command.id,
            description: command.description,
          });
        });
      });
  }

  protected setupDescribeCommand(program: CommanderCommand) {
    program
      .command("describe <commandId>")
      .description("Describes a certain command")
      .action((commandId) => {
        const command = this.getCommand(commandId);

        console.log(
          command.description || "This command doesn't have a description."
        );
      });
  }

  protected setupRunCommand(program: CommanderCommand) {
    program
      .command("run <commandId>")
      .option(
        "-m, --model <modelData>",
        "Fill in data model as JavaScript plain object"
      )
      .description("Execute a custom command")
      .action((commandId, data) => {
        let model: any = {};
        // Sorry
        if (data.model) {
          eval(`model = ${data.model}`);
        }
        const command = this.getCommand(commandId);
        if (!command) {
          console.error(`Command specified: "${commandId}" could not be found`);
          process.exit(1);
        }
        this.run(command, {
          model,
        });
      });
  }
}
