import { Kernel } from "@bluelibs/core";
import { LoggerBundle } from "../LoggerBundle";

export const createKernel = (): Kernel => {
  return new Kernel({
    bundles: [new LoggerBundle()],
  });
};
