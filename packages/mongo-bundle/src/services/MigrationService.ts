import { ContainerInstance, Service } from "@bluelibs/core";
import { LoggerService } from "@bluelibs/logger-bundle";
import {
  IMigrationStatus,
  MigrationsCollection,
} from "../models/MigrationsCollection";

export interface IMigrationConfig {
  up: (container: ContainerInstance) => any;
  down: (container: ContainerInstance) => any;
  version: number;
  name: string;
}

@Service()
export class MigrationService {
  public migrationConfigs: IMigrationConfig[] = [];

  constructor(
    protected migrationsCollection: MigrationsCollection,
    protected logger: LoggerService,
    protected container: ContainerInstance
  ) {}

  add(config: IMigrationConfig) {
    if (this.getConfigByVersion(config.version)) {
      throw new Error(`You already have a migration added with this version.`);
    }
    if (config.version === 0 || config.version < 0) {
      throw new Error(
        `You can't add this version, select a positive number different from 0`
      );
    }
    this.migrationConfigs.push(config);
    this.migrationConfigs = this.migrationConfigs.sort((a, b) => {
      return a.version - b.version;
    });
  }

  getConfigByVersion(version: number): IMigrationConfig | null {
    return this.migrationConfigs.find((config) => {
      return config.version === version;
    });
  }

  async getVersion() {
    return (await this.getStatus()).version;
  }

  async updateStatus(data: Partial<IMigrationStatus>) {
    const status = await this.getStatus();
    await this.migrationsCollection.updateOne(
      {
        _id: "status",
      },
      {
        $set: data,
      }
    );
  }

  async getStatus(): Promise<IMigrationStatus> {
    let control = await this.migrationsCollection.findOne({ _id: "status" });
    if (!control) {
      const lastMigration = this.migrationConfigs[
        this.migrationConfigs.length - 1
      ];
      control = {
        _id: "status",
        locked: false,
        version: 0,
      };
      await this.migrationsCollection.insertOne(control);
    }

    return control;
  }

  async lock() {
    // This is atomic. The selector ensures only one caller at a time will see
    // the unlocked control, and locking occurs in the same update's modifier.
    // All other simultaneous callers will get false back from the update.
    const result = await this.migrationsCollection.updateOne(
      { _id: "status", locked: false },
      { $set: { locked: true, lockedAt: new Date() } }
    );

    if (result.modifiedCount === 1) {
      return true;
    } else {
      return false;
    }
  }

  async run(direction: "up" | "down", config: IMigrationConfig) {
    if (typeof config[direction] !== "function") {
      throw new Error(
        "Cannot migrate " + direction + " on version " + config.version
      );
    }

    function maybeName() {
      return config.name ? " (" + config.name + ")" : "";
    }

    this.logger.info(
      "Running " + direction + "() on version " + config.version + maybeName()
    );

    await config[direction](this.container);
  }

  // Side effect: saves version.
  async unlock(currentVersion: number) {
    await this.updateStatus({
      locked: false,
      version: currentVersion,
      lastError: null,
    });
  }

  /**
   * Migrates to latest version
   */
  async migrateToLatest(): Promise<void> {
    if (this.migrationConfigs.length > 0) {
      const lastMigration = this.migrationConfigs[
        this.migrationConfigs.length - 1
      ];

      return this.migrateTo(lastMigration.version);
    }
  }

  async rerun(version: number, direction: "up" | "down" = "up") {
    // We are now in locked mode and we can do our thingie
    this.logger.info("Rerunning version " + version);
    await this.run(direction, this.getConfigByVersion(version));
    this.logger.info("Finished migrating.");
  }

  async migrateTo(version: number): Promise<void> {
    const status = await this.getStatus();
    let currentVersion = status.version;

    if ((await this.lock()) === false) {
      this.logger.info("Not migrating, control is locked.");
      return;
    }

    if (currentVersion === version) {
      this.logger.info("Not migrating, already at version " + version);
      this.unlock(currentVersion);
      return;
    }

    var startIdx = this.migrationConfigs.findIndex(
      (c) => c.version === currentVersion
    );
    var endIdx = this.migrationConfigs.findIndex((c) => c.version === version);

    this.logger.info(`Bring it to: ${version}`);
    this.logger.info("startIdx:" + startIdx + " endIdx:" + endIdx);
    this.logger.info(`Migrating from ${currentVersion} to ${version}`);

    try {
      if (currentVersion < version) {
        for (var i = startIdx; i < endIdx; i++) {
          const migration = this.migrationConfigs[i + 1];
          if (migration) {
            await this.run("up", migration);
            currentVersion = migration.version;
          }
        }
      } else {
        // When you're migrating to a version, you don't want to execute that down() version?
        for (var i = startIdx; i > endIdx; i--) {
          const migration = this.migrationConfigs[i - 1];
          if (migration) {
            await this.run("down", migration);
            currentVersion = migration.version;
          }
        }
      }
    } catch (e) {
      this.logger.error(
        `Error while migrating from ${currentVersion}. Aborted migration. ${e.toString()}`
      );
      await this.updateStatus({
        lastError: {
          fromVersion: currentVersion,
          message: e.toString(),
        },
      });
      await this.lock();
      throw e;
    }

    await this.unlock(currentVersion);
    this.logger.info("Finished migrating.");
  }
}
