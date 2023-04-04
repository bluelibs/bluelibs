import { Bundle, Kernel } from "@bluelibs/core";
import { GraphQLBundle, Loader } from "@bluelibs/graphql-bundle";
import { LoggerBundle } from "@bluelibs/logger-bundle";
import { XBundle } from "@bluelibs/x-bundle";
import { MongoBundle } from "@bluelibs/mongo-bundle";
import { SecurityBundle } from "@bluelibs/security-bundle";
import { PasswordBundle } from "@bluelibs/password-bundle";
import { HTTPBundle } from "@bluelibs/http-bundle";
import { SecurityMongoBundle } from "@bluelibs/security-mongo-bundle";
import { XAuthBundle } from "..";
import { EmailBundle } from "@bluelibs/email-bundle";

export const PORT = 64022;
export async function createEcosystem(configXAuthBundle = {}) {
  try {
    const kernel = new Kernel({
      bundles: [
        new LoggerBundle(),
        new GraphQLBundle(),
        new EmailBundle(),
        new HTTPBundle({
          port: PORT,
        }),
        new MongoBundle({
          uri: "mongodb://localhost:27017/test",
        }),
        new SecurityMongoBundle(),
        new SecurityBundle(),
        new PasswordBundle(),

        new XAuthBundle(configXAuthBundle),
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
