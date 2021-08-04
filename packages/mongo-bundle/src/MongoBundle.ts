import { Bundle } from "@bluelibs/core";
import { MongoClientOptions } from "mongodb";
import { MONGO_URL, MONGO_CONNECTION_OPTIONS } from "./constants";
import { DatabaseService } from "./services/DatabaseService";
import { MigrationService } from "./services/MigrationService";

export interface IMongoBundleConfigType {
  uri: string;
  options?: MongoClientOptions;
  /**
   * Whether to run the migration in the initialisation phase automatically.
   */
  automigrate?: boolean;
}

export class MongoBundle extends Bundle<IMongoBundleConfigType> {
  defaultConfig = {
    automigrate: true,
  };

  async validate(config: IMongoBundleConfigType) {
    if (!config.uri) {
      throw new Error(`Please specify the "uri" parameter for MongoBundle.`);
    }
  }

  async prepare() {
    this.container.set(MONGO_URL, this.config.uri);
    this.container.set(MONGO_CONNECTION_OPTIONS, this.config.options || {});
  }

  async init() {
    const databaseService = this.container.get(DatabaseService);
    await databaseService.init();

    if (this.config.automigrate) {
      const migrationService = this.container.get(MigrationService);
      await migrationService.migrateToLatest();
    }
  }

  /**
   * Closign the connection to the database server
   */
  async shutdown() {
    const databaseService = this.container.get(DatabaseService);
    databaseService.client.close();
  }
}
