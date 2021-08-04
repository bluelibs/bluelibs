import {
  Bundle,
  EventManager,
  BundleBeforePrepareEvent,
  Constructor,
  BundleAfterInitEvent,
} from "@bluelibs/core";
import {
  IPermissionPersistance,
  ISessionPersistance,
  IUserPersistance,
  SecurityBundle,
} from "@bluelibs/security-bundle";
import { UsersCollection } from "./collections/Users.collection";
import { PermissionsCollection } from "./collections/Permissions.collection";
import { SessionsCollection } from "./collections/Sessions.collection";
import {
  USERS_COLLECTION_TOKEN,
  PERMISSIONS_COLLECTION_TOKEN,
  SESSIONS_COLLECTION_TOKEN,
} from "./constants";
import { Collection, MongoBundle } from "@bluelibs/mongo-bundle";

export interface ISecurityMongoBundleConfig {
  usersCollection?: Constructor<IUserPersistance>;
  permissionsCollection?: Constructor<IPermissionPersistance>;
  sessionsCollection?: Constructor<ISessionPersistance>;
}

export class SecurityMongoBundle extends Bundle<ISecurityMongoBundleConfig> {
  dependencies = [SecurityBundle];

  protected defaultConfig = {
    usersCollection: UsersCollection,
    permissionsCollection: PermissionsCollection,
    sessionsCollection: SessionsCollection,
  };

  async hook() {
    const manager = this.get<EventManager>(EventManager);

    manager.addListener(
      BundleBeforePrepareEvent,
      (e: BundleBeforePrepareEvent) => {
        const { bundle } = e.data;
        if (bundle instanceof SecurityBundle) {
          const {
            permissionsCollection,
            usersCollection,
            sessionsCollection,
          } = this.config;

          // There is the possibility that they have been nullified
          // For example, the developer may want to replace a certain interface with something else
          permissionsCollection &&
            bundle.setPermissionPersistance(permissionsCollection);
          usersCollection && bundle.setUserPersistence(usersCollection);
          sessionsCollection &&
            bundle.setSessionPersistance(sessionsCollection);
        }
      }
    );

    manager.addListener(BundleAfterInitEvent, (e) => {
      if (e.data.bundle instanceof MongoBundle) {
        this.warmup(
          Object.values(this.config).filter((v) => v instanceof Collection)
        );
      }
    });
  }

  async prepare() {
    this.container.set({
      id: USERS_COLLECTION_TOKEN,
      type: this.config.usersCollection,
    });
    this.container.set({
      id: PERMISSIONS_COLLECTION_TOKEN,
      type: this.config.permissionsCollection,
    });
    this.container.set({
      id: SESSIONS_COLLECTION_TOKEN,
      type: this.config.sessionsCollection,
    });
  }
}
