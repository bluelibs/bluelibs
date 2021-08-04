import { Event } from "@bluelibs/core";
import { ILog } from "./defs";

export class LogEvent extends Event<{ log: ILog }> {}
