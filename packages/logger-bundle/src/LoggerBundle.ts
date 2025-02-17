import { Bundle } from "@bluelibs/core";
import { ILoggerBundleConfig, LogLevel } from "./defs";
import { ConsoleListener } from "./listeners/ConsoleListener";
import { LoggerService } from "./services/LoggerService";

export class LoggerBundle extends Bundle<ILoggerBundleConfig> {
  defaultConfig = {
    console: true,
    level: LogLevel.INFO,
  };

  async prepare() {
    this.get<LoggerService>(LoggerService);
    if (this.config.console) {
      this.warmup([ConsoleListener]);
    }
  }

  async init() {}
}
