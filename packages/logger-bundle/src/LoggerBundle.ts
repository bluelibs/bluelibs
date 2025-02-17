import { Bundle } from "@bluelibs/core";
import { ILoggerBundleConfig, LogLevel } from "./defs";
import { ConsoleListener } from "./listeners/ConsoleListener";
import { LoggerService } from "./services/LoggerService";

export class LoggerBundle extends Bundle<ILoggerBundleConfig> {
  defaultConfig = {
    console: true,
    level: LogLevel.DEBUG,
  };

  async prepare() {
    this.get<LoggerService>(LoggerService);
    if (this.config.console) {
      const consoleListener = this.get<ConsoleListener>(ConsoleListener);
      consoleListener.minLogLevel = this.config.level;
      this.warmup([consoleListener]);
    }
  }

  async init() {}
}
