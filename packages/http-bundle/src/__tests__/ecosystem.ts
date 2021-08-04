import { Kernel } from "@bluelibs/core";
import { LoggerBundle } from "@bluelibs/logger-bundle";
import { HTTPBundle } from "../HTTPBundle";

export const createKernel = (): Kernel => {
  return new Kernel({
    bundles: [
      new LoggerBundle(),
      new HTTPBundle({
        port: 6000,
      }),
    ],
  });
};
