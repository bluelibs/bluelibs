// Create a kernel with a bundle

import { Kernel, ContainerInstance } from "@bluelibs/core";
import { MongoBundle } from "@bluelibs/mongo-bundle";
import { ApolloBundle } from "@bluelibs/apollo-bundle";
import { ApolloSecurityBundle } from "@bluelibs/apollo-security-bundle";
import { XBundle } from "./../../XBundle";
import { LoggerBundle } from "@bluelibs/logger-bundle";

import { SecurityBundle } from "@bluelibs/security-bundle";
import { SecurityMongoBundle } from "@bluelibs/security-mongo-bundle";
import { PasswordBundle } from "@bluelibs/password-bundle";

import { GraphQLBundle } from "@bluelibs/graphql-bundle";

export async function createEcosystem(): Promise<ContainerInstance> {
  const kernel = new Kernel({
    bundles: [
      new LoggerBundle({
        console: false,
      }),
      new MongoBundle({
        uri: "mongodb://localhost:27017/tests",
      }),
      new PasswordBundle(),
      new GraphQLBundle(),
      new SecurityBundle(),
      new SecurityMongoBundle(),
      new XBundle(),
      new ApolloBundle({
        port: 7000,
      }),
      new ApolloSecurityBundle(),
    ],
    parameters: {
      testing: true,
    },
  });

  await kernel.init();

  return kernel.container;
}
