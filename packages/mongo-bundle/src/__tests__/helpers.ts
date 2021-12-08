import { Kernel, Bundle, ContainerInstance } from "@bluelibs/core";
import { LoggerBundle } from "@bluelibs/logger-bundle";
import { MongoBundle } from "../MongoBundle";
import { DatabaseService } from "../services/DatabaseService";
import { MigrationService } from "../services/MigrationService";

const kernel = new Kernel({
  bundles: [
    new MongoBundle({
      uri: "mongodb://localhost:27017/test",
      automigrate: false,
      options: {
        maxPoolSize: 9999,
      },
    }),
    new LoggerBundle({
      console: false,
    }),
  ],
});

export async function getEcosystem(): Promise<{
  container: ContainerInstance;
}> {
  return {
    container: kernel.container,
  };
}

beforeAll(async () => {
  await kernel.init();
});

beforeEach(async () => {
  const dbService = kernel.container.get<DatabaseService>(DatabaseService);
  const db = dbService.client.db("test");

  await db.collection("posts").deleteMany({});
  await db.collection("users").deleteMany({});
  await db.collection("comments").deleteMany({});
  await db.collection("tags").deleteMany({});
  await db.collection("migrations").deleteMany({});

  kernel.container.get(MigrationService).migrationConfigs = [];
});
