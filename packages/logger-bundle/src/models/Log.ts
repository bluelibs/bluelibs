import { ILog, LogLevel } from "../defs";

export class Log<TContext = unknown> implements ILog<TContext> {
  public readonly message: string;
  public readonly level: LogLevel;
  public context?: TContext;

  constructor(message: string, level: LogLevel, context?: TContext) {
    this.message = message;
    this.level = level;
    this.context = context;
  }
}
