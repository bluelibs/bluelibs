import { Kernel } from "@bluelibs/core";
import { LoggerBundle } from "../LoggerBundle";
import { ILoggerBundleConfig } from "../defs";

export const createKernel = (config: ILoggerBundleConfig = {}): Kernel => {
  return new Kernel({
    bundles: [new LoggerBundle(config)],
  });
};
