import { MongoBundle, DatabaseService } from "@bluelibs/mongo-bundle";
import { SecurityBundle } from "@bluelibs/security-bundle";
import { ContainerInstance, Kernel, Bundle } from "@bluelibs/core";
import { SecurityMongoBundle } from "../SecurityMongoBundle";
import { Mocks } from "@bluelibs/security-bundle/dist/__tests__/reusable";
import { UsersCollection } from "../collections/Users.collection";
import { PermissionsCollection } from "../collections/Permissions.collection";
import { SessionsCollection } from "../collections/Sessions.collection";

export const kernel = new Kernel();

export const container = kernel.container;

// Jest runs each test file in its own worker by default. Because every worker
// drops the shared database at boot, parallel workers were wiping each other's
// data mid-test. Scoping the database per worker keeps the files independent.
const databaseName = `test_${process.env.JEST_WORKER_ID ?? "local"}`;

export async function createEcosystem(
  init?: () => void | Promise<void>
): Promise<{
  container: ContainerInstance;
  teardown: () => Promise<void>;
  cleanup: () => Promise<void>;
}> {
  kernel.addBundle(
    new MongoBundle({
      uri: `mongodb://localhost:27017/${databaseName}`,
    })
  );

  class AppBundle extends Bundle {
    async init() {
      if (init) {
        return init.call(this);
      }
    }
  }

  kernel.addBundle(
    new SecurityBundle({
      permissionTree: Mocks.PermissionTree,
      // By default the SecurityBundle registers a setInterval to clean expired
      // sessions. In tests that timer keeps the jest worker's event loop alive
      // and the worker is force-exited. Tests manage sessions explicitly, so
      // automatic cleanup is unnecessary here.
      session: {
        cleanup: false,
      },
    })
  );
  kernel.addBundle(new SecurityMongoBundle());
  kernel.addBundle(new AppBundle());

  await kernel.init();

  const dbService = kernel.container.get<DatabaseService>(DatabaseService);
  await dbService.client.db(databaseName).dropDatabase();

  // The teardown hook is registered per test file, so it may run more than once
  // per worker. Closing an already-closed client rejects, so only close once.
  let teardownCalled = false;

  return {
    container: kernel.container,
    cleanup: async () => {
      await kernel.container.get(UsersCollection).deleteMany({});
      await kernel.container.get(PermissionsCollection).deleteMany({});
      await kernel.container.get(SessionsCollection).deleteMany({});
    },
    teardown: async () => {
      if (teardownCalled) {
        return;
      }
      teardownCalled = true;

      try {
        await dbService.client.close();
      } catch (err) {
        // The driver may reject close() if it has to interrupt a connection that
        // is still checked out from the last operation. There is nothing left to
        // clean up in that case, so swallow the error.
      }
    },
  };
}
