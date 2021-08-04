import { MongoBundle, DatabaseService } from "@bluelibs/mongo-bundle";
import { ContainerInstance, Kernel, Bundle } from "@bluelibs/core";
import { CronsCollection } from "../collections/Crons.collection";
import { XCronBundle } from "../XCronBundle";
import { LoggerBundle } from "@bluelibs/logger-bundle";

export async function createEcosystem(
  init?: any
): Promise<{
  container: ContainerInstance;
  teardown: () => void;
  cleanup: () => Promise<void>;
}> {
  const kernel = new Kernel();
  kernel.addBundle(
    new MongoBundle({
      uri: "mongodb://localhost:27017/test",
    })
  );

  class AppBundle extends Bundle {
    async init() {
      if (init) {
        return init.call(this);
      }
    }
  }

  kernel.addBundle(new LoggerBundle());
  kernel.addBundle(new XCronBundle());
  kernel.addBundle(new AppBundle());

  await kernel.init();

  const dbService = kernel.container.get<DatabaseService>(DatabaseService);
  await dbService.client.db("test").dropDatabase();

  return {
    container: kernel.container,
    cleanup: async () => {
      await kernel.container.get(CronsCollection).deleteMany({});
    },
    teardown: () => {
      dbService.client.close();
    },
  };
}
