import { MongoBundle, DatabaseService } from "@bluelibs/mongo-bundle";
import { SecurityBundle } from "@bluelibs/security-bundle";
import { ContainerInstance, Kernel, Bundle } from "@bluelibs/core";
import { SecurityMongoBundle } from "../SecurityMongoBundle";
import { Mocks } from "@bluelibs/security-bundle/dist/__tests__/reusable";
import { UsersCollection } from "../collections/Users.collection";
import { PermissionsCollection } from "../collections/Permissions.collection";
import { SessionsCollection } from "../collections/Sessions.collection";

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

  kernel.addBundle(
    new SecurityBundle({
      permissionTree: Mocks.PermissionTree,
    })
  );
  kernel.addBundle(new SecurityMongoBundle());
  kernel.addBundle(new AppBundle());

  await kernel.init();

  const dbService = kernel.container.get<DatabaseService>(DatabaseService);
  await dbService.client.db("test").dropDatabase();

  return {
    container: kernel.container,
    cleanup: async () => {
      await kernel.container.get(UsersCollection).deleteMany({});
      await kernel.container.get(PermissionsCollection).deleteMany({});
      await kernel.container.get(SessionsCollection).deleteMany({});
    },
    teardown: () => {
      dbService.client.close();
    },
  };
}
