// Create a kernel with a bundle

import { Kernel } from "@bluelibs/core";
import { MongoBundle } from "@bluelibs/mongo-bundle";
import { XBundle } from "../../XBundle";
import { LoggerBundle } from "@bluelibs/logger-bundle";
import { ValidatorBundle } from "@bluelibs/validator-bundle";

export function createKernel(): Kernel {
  return new Kernel({
    bundles: [
      new LoggerBundle(),
      new MongoBundle({
        uri: "mongodb://localhost:27017/tests",
      }),
      new ValidatorBundle(),
      new XBundle(),
    ],
    parameters: {
      testing: true,
    },
  });
}
