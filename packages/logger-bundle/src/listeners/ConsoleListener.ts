import { Listener, Service } from "@bluelibs/core";
import { LogEvent } from "../events";
import { LogLevel } from "../defs";
import { Log } from "../models/Log";

@Service()
export class ConsoleListener extends Listener {
  init() {
    this.on(LogEvent, (e: LogEvent) => {
      const log = e.data.log;

      const consoleLogArguments = [`[${log.level}] ${log.message}`];
      if (log.context) {
        consoleLogArguments.push(log.context);
      }

      console.log(...consoleLogArguments);
    });
  }
}
