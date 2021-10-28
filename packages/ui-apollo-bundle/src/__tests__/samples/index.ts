import { Kernel } from "@bluelibs/core";
import { UIApolloBundle } from "../../UIApolloBundle";

export function createSampleKernel() {
  return new Kernel({
    bundles: [new UIApolloBundle()],
  });
}
