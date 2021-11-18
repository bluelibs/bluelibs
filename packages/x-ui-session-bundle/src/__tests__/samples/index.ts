import { Kernel } from "@bluelibs/core";
import { XUISessionBundle } from "../..";
import { sessionsConfig } from "../ecosystem";

export function createSampleKernel() {
  return new Kernel({
    bundles: [new XUISessionBundle(sessionsConfig)],
  });
}
