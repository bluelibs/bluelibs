import { Kernel } from "@bluelibs/core";
import { XUIGuardianBundle } from "../..";
import { AppGuardian } from "./AppGuardian";

export function createSampleKernel() {
  return new Kernel({
    bundles: [
      new XUIGuardianBundle({
        guardianClass: AppGuardian,
      }),
    ],
  });
}
