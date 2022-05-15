import { Bundle, Kernel } from "@bluelibs/core";
import { GraphQLBundle, Loader } from "@bluelibs/graphql-bundle";
import { LoggerBundle } from "@bluelibs/logger-bundle";
import { XBundle } from "@bluelibs/x-bundle";
import { MongoBundle } from "@bluelibs/mongo-bundle";
import { SecurityBundle } from "@bluelibs/security-bundle";
import { PasswordBundle } from "@bluelibs/password-bundle";
import { HTTPBundle } from "@bluelibs/http-bundle";
import { SecurityMongoBundle } from "@bluelibs/security-mongo-bundle";
import { XPasswordBundle } from "../..";

export async function createEcosystem() {
  try {
    const kernel = new Kernel({
      bundles: [
        new LoggerBundle(),
        new GraphQLBundle(),
        new MongoBundle({
          uri: "mongodb://localhost:27017/test",
        }),
        new SecurityMongoBundle(),
        new SecurityBundle(),
        new PasswordBundle(),
        new HTTPBundle(),
        new XPasswordBundle(),
        new XBundle(),
      ],
      parameters: {
        testing: true,
      },
    });
    await kernel.init();

    return kernel.container;
  } catch (err) {
    throw err;
  }
}

//export const kernel = createKernel();
//export const container = kernel.container;
