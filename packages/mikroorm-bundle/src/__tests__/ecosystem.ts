import { Kernel } from "@bluelibs/core";
import { MikroORMBundle } from "../MikroORMBundle";
import { MongoDriver } from "@mikro-orm/mongodb";

export const createKernel = (): Kernel => {
  return new Kernel({
    bundles: [
      new MikroORMBundle({
        options: {
          dbName: "test-orm",
          driver: MongoDriver,
          clientUrl: "mongodb://localhost:27017",
          allowGlobalContext: true,
        },
      }),
    ],
  });
};
