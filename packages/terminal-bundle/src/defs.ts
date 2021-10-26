import { Constructor, ContainerInstance } from "@bluelibs/core";
import { DistinctQuestion } from "inquirer";
import { BlueprintWriterSession } from "./models";

export interface ITerminalBundleConfig {
  commands?: ICommand[];
  version?: string;
}

export interface ICommandService {
  registerCommand(command: ICommand);
  getCommands(): ICommand[];
  getCommand(namespace: string, name: string): ICommand;
  /**
   * Continously ask for a command, execute it, then ask for another command?
   */
  inquire(): Promise<void>;
  run(command: ICommand, options?: ICommandRunOptions): Promise<void>;
}

export interface ICommandRunOptions {
  /**
   * Some pre-existing data to feed the model (if applicable)
   */
  model?: any;
}

export interface ICommand {
  id: string;
  description?: string;
  inquirer?: Constructor<IInquirer>;
  writer?: Constructor<IBlueprintWriter>;
  execute?: Function; // TODO:
  executor?: Constructor<IExecutor>;
  sessionFactory?: (container: ContainerInstance) => IBlueprintWriterSession;
}

export interface IExecutor<M = any> {
  execute(model: M);
}

export interface IInquirer<M = any> {
  /**
   * @param existingDataSet This refers to the fact that you can already have some default values
   */
  model: M;
  inquire(): void;
  prompt(
    field: string,
    prompt: IPrompt,
    options?: IInquiryPromptOptions
  ): Promise<void>;
}

export interface IPrompter {
  prompt<V = any>(prompt: IPrompt): Promise<V>;
  promptMany<V = any>(
    prompt: IPrompt,
    continuationMessage: string
  ): Promise<V[]>;
}

export interface IPrompt {
  /**
   * Find out more: https://github.com/SBoudrias/Inquirer.js#objects
   */
  question?: DistinctQuestion;
  inquirer?: Constructor<IInquirer>;
  default?: any;
}

export interface IBlueprintWriter<
  T = any,
  SessionType = IBlueprintWriterSession
> {
  write(model: T, session: SessionType);
}

export interface IBlueprintWriterOperation {
  type:
    | "mkdirp"
    | "copyDir"
    | "write"
    | "append"
    | "prepend"
    | "custom"
    | "deep-extend-json";
  paths: string[];
  value?: any;
}

export type IBlueprintTemplate<M = any> = (model: M, helper?) => string;

export interface IBlueprintWriterSession {
  afterCommit(handler: any): IBlueprintWriterSession;
  getAllAffectedPaths(showRelative: boolean): string[];
  addOperation(operation: IBlueprintWriterOperation): IBlueprintWriterSession;
  copyDir(from: string, to: string, options?: any): IBlueprintWriterSession;
  mkdir(path: string): IBlueprintWriterSession;
  write(path: string, content: string): IBlueprintWriterSession;
  append(path: string, content: string): IBlueprintWriterSession;
  prepend(path: string, content: string): IBlueprintWriterSession;
  installNpmPackage(
    name: string,
    version: string,
    options?: { dev?: boolean; rootDir?: string }
  ): IBlueprintWriterSession;
  addEnvironmentVariable(name: string, value: string): IBlueprintWriterSession;

  /**
   * All commands get registered in a queue somewhere
   */
  commit(options?: IBlueprintSessionCommitOptions): void;
}

export interface IBlueprintSessionCommitOptions {
  verbose: boolean;
  skipInstructions: boolean;
}

export interface IInquiryPromptOptions {
  skipIfAlreadyExists?: boolean;
  /**
   * This will continously interogate
   */
  many?: boolean;
  /**
   * Makes sense only in the context of many: true
   * Represents the question to ask (again) once the data has been inputted
   */
  continuationMessage?: string;
  /**
   * Mutually exclusive with `continuationMessage`, it represents whether to ask to enter
   * the info, needs a `new ExitInquiryException()` thrown to break the loop.
   */
  autocontinue?: boolean;
}
