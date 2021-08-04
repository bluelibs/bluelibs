import { ILog, LogLevel } from "../defs";

export class Log implements ILog {
  public readonly message: string;
  public readonly level: LogLevel;
  public context: any;

  constructor(message: string, level: LogLevel, context?: any) {
    this.message = message;
    this.level = level;
    this.context = context;
  }
}
