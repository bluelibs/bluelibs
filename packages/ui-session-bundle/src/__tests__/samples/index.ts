import { Kernel } from "@bluelibs/core";
import { UISessionBundle } from "../..";
import { sessionsConfig } from "../ecosystem";

export function createSampleKernel() {
  return new Kernel({
    bundles: [new UISessionBundle(sessionsConfig)],
  });
}
