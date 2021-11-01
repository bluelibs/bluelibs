import { Kernel } from "@bluelibs/core";
import { UII18NBundle } from "../../UII18NBundle";

export function createSampleKernel() {
  return new Kernel({
    bundles: [new UII18NBundle()],
  });
}
