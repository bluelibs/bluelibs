import { ApolloBundle } from "@bluelibs/apollo-bundle";
import { Bundle, Kernel } from "@bluelibs/core";
import { GraphQLBundle, Loader } from "@bluelibs/graphql-bundle";
import { LoggerBundle } from "@bluelibs/logger-bundle";
import { XS3Bundle } from "../XS3Bundle";
import { XBundle } from "@bluelibs/x-bundle";
import { MongoBundle } from "@bluelibs/mongo-bundle";
import { SecurityBundle } from "@bluelibs/security-bundle";
import { Stores } from "../defs";

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
        port: 5000,
      }),
      new GraphQLBundle(),
      new LoggerBundle(),
      new SecurityBundle(),
      new MongoBundle({
        uri: "mongodb://localhost:27017/test",
      }),
      new XBundle(),
      new XS3Bundle({
        stores: [
          new Stores.S3({
            id: "s3-store",
            credentials: {
              accessKeyId: "A",
              secretAccessKey: "B",
              bucket: "test.com",
              endpoint: "https://s3.amazonaws.com/test.com",
              region: "eu-west-2",
            },
            //the s3 store will be the default store, if not defined by default the first store of the stores iwll be the default
            default: true,
          }),
          new Stores.Local({
            id: "localstorage",
            credentials: {
              localStoragePath: "./temp",
              downloadUrl: "/download-local-file",
            },
          }),
          new Stores.Database({
            id: "dbstorage",
            credentials: {
              downloadUrl: "/download-db-file",
            },
          }),
        ],
      }),
      new MyBundle(),
    ],
  });
}

export const kernel = createKernel();
export const container = kernel.container;
