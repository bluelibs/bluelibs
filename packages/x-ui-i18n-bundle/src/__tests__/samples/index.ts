import { Kernel } from "@bluelibs/core";
import { XUII18NBundle } from "../../XUII18NBundle";

export function createSampleKernel() {
  return new Kernel({
    bundles: [new XUII18NBundle()],
  });
}
