import { Kernel, ContainerInstance } from "@bluelibs/core";
import { LoggerBundle } from "@bluelibs/logger-bundle";
import { MongoBundle } from "../MongoBundle";
import { DatabaseService } from "../services/DatabaseService";
import { MigrationService } from "../services/MigrationService";

// Isolate the database per jest worker so parallel workers (CI runs with
// --maxWorkers=2) never clean up each other's in-flight documents.
const mongoUri =
  process.env.MONGODB_URI ||
  `mongodb://localhost:27017/test_${process.env.JEST_WORKER_ID ?? "local"}`;
const databaseName = mongoUri.split("/").pop() || "test";

const kernel = new Kernel({
  bundles: [
    new MongoBundle({
      uri: mongoUri,
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

afterAll(async () => {
  await kernel.shutdown();
});

beforeEach(async () => {
  const dbService = kernel.container.get<DatabaseService>(DatabaseService);
  const db = dbService.client.db(databaseName);

  await db.collection("posts").deleteMany({});
  await db.collection("users").deleteMany({});
  await db.collection("comments").deleteMany({});
  await db.collection("tags").deleteMany({});
  await db.collection("migrations").deleteMany({});

  kernel.container.get(MigrationService).migrationConfigs = [];
});
