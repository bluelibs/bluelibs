// Create a kernel with a bundle

import { Kernel, ContainerInstance } from "@bluelibs/core";
import { MongoBundle } from "@bluelibs/mongo-bundle";
import { ApolloBundle } from "@bluelibs/apollo-bundle";
import { XBundle } from "../../XBundle";
import { LoggerBundle } from "@bluelibs/logger-bundle";

export async function createEcosystem(): Promise<ContainerInstance> {
  const kernel = new Kernel({
    bundles: [
      new LoggerBundle({
        console: false,
      }),
      new MongoBundle({
        uri: "mongodb://localhost:27017/tests",
      }),
      new XBundle({
        live: {
          debug: false,
          redis: {
            host: "127.0.0.1",
            port: 6379,
          },
        },
      }),
      new ApolloBundle({
        port: 6000,
      }),
    ],
    parameters: {
      testing: true,
    },
  });

  await kernel.init();

  return kernel.container;
}
