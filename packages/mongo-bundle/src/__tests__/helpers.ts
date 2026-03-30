import { Kernel, Bundle, ContainerInstance } from "@bluelibs/core";
import { LoggerBundle } from "@bluelibs/logger-bundle";
import { MongoBundle } from "../MongoBundle";
import { DatabaseService } from "../services/DatabaseService";
import { MigrationService } from "../services/MigrationService";

// Check if we're in CI environment
const isCI = process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";

// Check if we should skip MongoDB tests
const skipMongoTests = isCI && !process.env.MONGODB_URI;

const kernel = new Kernel({
  bundles: [
    new MongoBundle({
      uri: process.env.MONGODB_URI || "mongodb://localhost:27017/test",
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

export { skipMongoTests };

beforeAll(async () => {
  if (skipMongoTests) {
    console.log("Skipping MongoDB tests - no MongoDB available");
    return;
  }
  await kernel.init();
});

afterAll(async () => {
  if (skipMongoTests) return;
  await kernel.shutdown();
});

beforeEach(async () => {
  if (skipMongoTests) return;
  const dbService = kernel.container.get<DatabaseService>(DatabaseService);
  const db = dbService.client.db("test");

  await db.collection("posts").deleteMany({});
  await db.collection("users").deleteMany({});
  await db.collection("comments").deleteMany({});
  await db.collection("tags").deleteMany({});
  await db.collection("migrations").deleteMany({});

  kernel.container.get(MigrationService).migrationConfigs = [];
});
