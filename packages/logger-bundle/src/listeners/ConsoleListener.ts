import { Listener, Service } from "@bluelibs/core";
import { LogEvent } from "../events";
import chalk from "chalk";
import { LogLevel } from "../defs";

@Service()
export class ConsoleListener extends Listener {
  init() {
    this.on(LogEvent, (e: LogEvent) => {
      const log = e.data.log;

      let color: any;
      if (log.level == LogLevel.INFO) {
        color = chalk.bgGreen.black;
      }
      if (log.level === LogLevel.WARNING) {
        color = chalk.bgYellowBright.black;
      }
      if (log.level === LogLevel.ERROR) {
        color = chalk.bgRedBright.black;
      }
      if (log.level === LogLevel.CRITICAL) {
        color = chalk.bgRedBright.black;
      }

      console.log(`${color(" " + log.level + " ")} ${log.message}`);
      if (log.context) {
        console.log(`Context: `, log.context);
      }
    });
  }
}
