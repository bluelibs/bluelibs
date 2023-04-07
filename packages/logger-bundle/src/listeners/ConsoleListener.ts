import { Listener, Service } from "@bluelibs/core";
import { LogEvent } from "../events";
import chalk from "chalk";
import { LogLevel } from "../defs";

@Service()
export class ConsoleListener extends Listener {
  lastLogDate: Date;

  init() {
    this.on(LogEvent, (e: LogEvent) => {
      const log = e.data.log;

      let color: any;
      // what are some good colors?
      if (log.level == LogLevel.INFO) {
        color = chalk.blueBright;
      }
      if (log.level === LogLevel.WARNING) {
        color = chalk.yellow;
      }
      if (log.level === LogLevel.ERROR) {
        color = chalk.red;
      }
      if (log.level === LogLevel.CRITICAL) {
        color = chalk.redBright;
      }

      const date = new Date();
      let diff = -1;
      // get diff of last log date and this date
      if (this.lastLogDate) {
        diff = date.getTime() - this.lastLogDate.getTime();
      }

      // create a human readable date that contains day of the month, and time including miliseconds
      this.lastLogDate = date;

      const hours = date.getHours();
      const minutes = date.getMinutes();
      const seconds = date.getSeconds();
      const milliseconds = date.getMilliseconds();

      const humanReadableDate = `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds
        .toString()
        .padStart(3, "0")}`;

      const contextPrefix = log.context ? `${log.context} ` : "";

      let msSinceLastLog = "";
      if (diff === 0) {
        msSinceLastLog = chalk.yellowBright(`⚡`);
      }
      if (diff > 0 && diff < 10000) {
        msSinceLastLog = chalk.greenBright(`+${diff}ms`);
      }
      if (diff > 10000) {
        // make it a lightning in utf-8 like this: ⚡
        msSinceLastLog = chalk.yellowBright(`⚡`);
      }

      const criticalAlertPrefix =
        log.level === LogLevel.CRITICAL ? "!!! CRITICAL !!! " : "";

      console.log(
        `${color(humanReadableDate)} ${chalk.bold(
          contextPrefix
        )}${msSinceLastLog}${color(criticalAlertPrefix)}\n${log.message}\n`
      );
    });
  }
}
