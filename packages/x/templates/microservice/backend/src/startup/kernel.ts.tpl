import { Kernel } from "@bluelibs/core";
import { ApolloBundle } from "@bluelibs/apollo-bundle";
import { MongoBundle } from "@bluelibs/mongo-bundle";
import { SecurityBundle } from "@bluelibs/security-bundle";
import { SecurityMongoBundle } from "@bluelibs/security-mongo-bundle";
import { LoggerBundle } from "@bluelibs/logger-bundle";
import { XBundle } from "@bluelibs/x-bundle";
import { ApolloSecurityBundle } from "@bluelibs/apollo-security-bundle";
import { PasswordBundle } from "@bluelibs/password-bundle";
import { XPasswordBundle } from "@bluelibs/x-password-bundle";
import { GraphQLBundle } from "@bluelibs/graphql-bundle";
import { EmailBundle } from "@bluelibs/email-bundle";
import { ValidatorBundle } from "@bluelibs/validator-bundle";
{{# if hasUploads }}
  import { XS3Bundle } from "@bluelibs/x-s3-bundle";
{{/ if }}
{{# if hasUsers }}
  import { UsersCollection } from "../bundles/AppBundle/collections";
{{/ if }}

import env from "./env";

export const kernel = new Kernel({
  parameters: {
    context: env.CONTEXT,
    debug: false,
    testing: process.env.NODE_ENV === "test",
  },
  bundles: [
    new LoggerBundle(),
    new ValidatorBundle(),
    new GraphQLBundle(),
    new ApolloBundle({
      port: env.ROOT_PORT,
      url: env.ROOT_URL,
      enableSubscriptions: true,
    }),
    new MongoBundle({
      uri: env.MONGO_URL,
    }),
    new SecurityBundle(),
    new SecurityMongoBundle({
      {{# if hasUsers }}
        usersCollection: UsersCollection
      {{/ if }}
    }),
    new ApolloSecurityBundle(),
    new XBundle({
      appUrl: env.APP_URL,
      rootUrl: env.ROOT_URL,
    }),
    new EmailBundle(),
    new PasswordBundle(),
    new XPasswordBundle(),
    {{# if hasUploads }}
      new XS3Bundle({
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        bucket: env.AWS_BUCKET,
        region: env.AWS_REGION,
        endpoint: env.AWS_ENDPOINT,
      }),
    {{/ if }}
  ],
});
