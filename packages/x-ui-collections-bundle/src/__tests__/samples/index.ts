import { Kernel } from "@bluelibs/core";
import { XUICollectionsBundle } from "../..";

export function createSampleKernel() {
  return new Kernel({
    bundles: [new XUICollectionsBundle()],
  });
}
