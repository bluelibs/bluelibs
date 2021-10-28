import { Kernel } from "@bluelibs/core";
import { XUIReactBundle } from "../..";

export function createSampleKernel() {
  return new Kernel({
    bundles: [new XUIReactBundle()],
  });
}
