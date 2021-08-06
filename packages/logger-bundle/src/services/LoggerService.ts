import { EventManager, Inject, Service } from "@bluelibs/core";
import { ILogger, LogLevel } from "../defs";
import { Log } from "../models";
import { LogEvent } from "../events";

@Service()
export class LoggerService implements ILogger {
  constructor(protected readonly eventManager: EventManager) {}

  /**
   * Dispatches a new log event into the system
   * @param log
   * @returns
   */
  async send(log: Log) {
    return this.eventManager.emit(new LogEvent({ log }));
  }

  /**
   * Log a critical message. Critical logs are used for security breaches or things that have high business impact
   */
  async critical(message: string, context: any): Promise<void> {
    const log = new Log(message, LogLevel.CRITICAL, context);

    await this.send(log);
  }

  /**
   * Log an info type log. Info logs described actions that have been done or are about to happen
   */
  async info(message: string, context?: any): Promise<void> {
    const log = new Log(message, LogLevel.INFO, context);

    await this.send(log);
  }

  /**
   * Warnings happen
   */
  async warning(message: string, context?: any): Promise<void> {
    const log = new Log(message, LogLevel.WARNING, context);

    await this.send(log);
  }

  async error(message: string, context?: any): Promise<void> {
    const log = new Log(message, LogLevel.ERROR, context);

    await this.send(log);
  }
}
