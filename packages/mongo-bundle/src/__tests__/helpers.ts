import { Kernel, Bundle, ContainerInstance } from "@bluelibs/core";
import { LoggerBundle } from "@bluelibs/logger-bundle";
import { MongoBundle } from "../MongoBundle";
import { DatabaseService } from "../services/DatabaseService";

export async function createEcosystem(
  init?: any
): Promise<{ container: ContainerInstance; teardown: () => Promise<void> }> {
  const kernel = new Kernel();
  kernel.addBundle(
    new MongoBundle({
      uri: "mongodb://localhost:27017/test",
      automigrate: false,
    })
  );

  kernel.addBundle(
    new LoggerBundle({
      console: false,
    })
  );

  class AppBundle extends Bundle {
    async init() {
      if (init) {
        return init.call(this);
      }
    }
  }

  kernel.addBundle(new AppBundle());

  await kernel.init();

  const dbService = kernel.container.get<DatabaseService>(DatabaseService);
  await dbService.client.db("test").dropDatabase();

  return {
    container: kernel.container,
    teardown: async () => {
      await dbService.client.close();
    },
  };
}
