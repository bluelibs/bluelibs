import { ApolloBundle } from "@bluelibs/apollo-bundle";
import { Bundle, Kernel } from "@bluelibs/core";
import { GraphQLBundle, Loader } from "@bluelibs/graphql-bundle";
import { LoggerBundle } from "@bluelibs/logger-bundle";
import { XS3Bundle } from "../XS3Bundle";
import { XBundle } from "@bluelibs/x-bundle";
import { MongoBundle } from "@bluelibs/mongo-bundle";
import { SecurityBundle } from "@bluelibs/security-bundle";

class MyBundle extends Bundle {
  async prepare() {
    this.container.get(Loader).load({
      typeDefs: `
        type User { name: String! }
      `,
    });
  }
}
export function createKernel() {
  return new Kernel({
    bundles: [
      new ApolloBundle({
        port: 5022,
      }),
      new GraphQLBundle(),
      new LoggerBundle(),
      new SecurityBundle(),
      new MongoBundle({
        uri: "mongodb://localhost:27017/test",
      }),
      new XBundle(),
      new XS3Bundle({
        accessKeyId: "A",
        secretAccessKey: "B",
        bucket: "test.com",
        endpoint: "https://s3.amazonaws.com/test.com",
        region: "eu-west-2",
      }),
      new MyBundle(),
    ],
  });
}
