import { Event } from "@bluelibs/core";
import { Inquirer } from "./models/Inquirer";
import {
  IPrompt,
  ICommand,
  IBlueprintWriter,
  IInquirer,
  IExecutor,
  IBlueprintWriterSession,
} from "./defs";
import { CommanderStatic, Command } from "commander";

export interface IBeforePromptEventData {
  field: string;
  prompt: IPrompt;
  inquirer: Inquirer;
}

export interface IAfterPromptEventData extends IBeforePromptEventData {
  value: any;
}

export class BeforePromptEvent extends Event<IBeforePromptEventData> {}
export class AfterPromptEvent extends Event<IAfterPromptEventData> {}

export interface IInquiryEventData {
  command: ICommand;
  inquirer: IInquirer;
}

export class BeforeInquiryEvent extends Event<IInquiryEventData> {}
export class AfterInquiryEvent extends Event<IInquiryEventData> {}

export interface IBlueprintWriteEventData {
  command: ICommand;
  writer: IBlueprintWriter;
  writerSession: IBlueprintWriterSession;
}

export class BeforeBlueprintWriteEvent extends Event<
  IBlueprintWriteEventData
> {}
export class AfterBlueprintWriteEvent extends Event<IBlueprintWriteEventData> {}

export interface IExecutionEventData {
  command: ICommand;
  executor: IExecutor;
}

export class BeforeExecutionEvent extends Event<IExecutionEventData> {}
export class AfterExecutionEvent extends Event<IExecutionEventData> {}

export class BeforeCommandRunEvent extends Event<{ command: ICommand }> {}
export class AfterCommandRunEvent extends Event<{ command: ICommand }> {}

export class BeforeProgramParseEvent extends Event<{ program: Command }> {}
export class AfterProgramParseEvent extends Event<{ program: Command }> {}
