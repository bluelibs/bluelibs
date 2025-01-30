import { ContainerInstance, Service } from "@bluelibs/core";
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
  /**
   * An array of all the migration configurations.
   */
  public migrationConfigs: IMigrationConfig[] = [];

  /**
   * Single doc in migrations collection that tracks the current status.
   */
  protected readonly MIGRATION_STATUS_ID = "status";

  constructor(
    protected readonly container: ContainerInstance,
    protected readonly migrationsCollection: MigrationsCollection
  ) {}

  /**
   * Adds a new migration configuration.
   */
  public add(config: IMigrationConfig): void {
    if (config.version <= 0) {
      throw new Error("Migration version must be a positive number.");
    }
    const existing = this.getConfigByVersion(config.version);
    if (existing) {
      throw new Error(
        `Migration with version ${config.version} already exists.`
      );
    }

    this.migrationConfigs.push(config);
    // Optional: keep them sorted
    this.migrationConfigs.sort((a, b) => a.version - b.version);
  }

  /**
   * Retrieves a migration configuration by its version.
   */
  public getConfigByVersion(version: number): IMigrationConfig | null {
    return this.migrationConfigs.find((m) => m.version === version) ?? null;
  }

  /**
   * Gets the current migration version.
   */
  public async getVersion(): Promise<number> {
    const status = await this.getStatus();
    return status.version;
  }

  /**
   * Updates the migration status document with the given data.
   */
  public async updateStatus(data: Partial<IMigrationStatus>): Promise<void> {
    // Fetch current status (or create default if not found).
    const currentStatus = await this.getStatus();

    const newStatus = {
      ...currentStatus,
      ...data,
      _id: this.MIGRATION_STATUS_ID, // Ensure ID is not overwritten
    };

    // Upsert the doc
    await this.migrationsCollection.updateOne(
      // @ts-ignore
      { _id: this.MIGRATION_STATUS_ID },
      { $set: newStatus },
      { upsert: true }
    );
  }

  /**
   * Retrieves the current migration status from the database.
   * If the document doesn't exist, create a default one.
   */
  public async getStatus(): Promise<IMigrationStatus> {
    let status = await this.migrationsCollection.findOne({
      // @ts-ignore
      _id: this.MIGRATION_STATUS_ID,
    });

    if (!status) {
      // Create a default migration status
      status = {
        _id: this.MIGRATION_STATUS_ID,
        version: 0,
        locked: false,
      };
      await this.migrationsCollection.insertOne(status);
    }

    return status;
  }

  /**
   * Attempts to lock the migration process to prevent concurrent migrations.
   */
  public async lock(): Promise<boolean> {
    const status = await this.getStatus();
    if (status.locked) {
      return false; // Already locked
    }

    // Set locked = true, lockedAt = now
    await this.updateStatus({ locked: true, lockedAt: new Date() });
    return true;
  }

  /**
   * Runs a migration in the specified direction.
   */
  public async run(
    direction: "up" | "down",
    config: IMigrationConfig
  ): Promise<void> {
    const fn = direction === "up" ? config.up : config.down;
    if (typeof fn !== "function") {
      throw new Error(
        `Migration function for '${direction}' is not defined on version ${config.version}.`
      );
    }

    try {
      await fn(this.container);
    } catch (error) {
      // Record error in status so you can inspect it later
      await this.updateStatus({
        lastError: {
          fromVersion: config.version,
          message: (error as Error).message || String(error),
        },
      });

      // Rethrow for further handling
      throw error;
    }
  }

  /**
   * Unlocks the migration process and updates the current version.
   */
  public async unlock(currentVersion: number): Promise<void> {
    await this.updateStatus({
      locked: false,
      lockedAt: undefined,
      version: currentVersion,
    });
  }

  /**
   * Migrates the system to the latest version found in `migrationConfigs`.
   */
  public async migrateToLatest(): Promise<void> {
    const maxVersion = this.migrationConfigs.length
      ? Math.max(...this.migrationConfigs.map((m) => m.version))
      : 0;
    await this.migrateTo(maxVersion);
  }

  /**
   * Re-runs a specific migration version in the given direction.
   */
  public async rerun(
    version: number,
    direction: "up" | "down" = "up"
  ): Promise<void> {
    const config = this.getConfigByVersion(version);
    if (!config) {
      throw new Error(`Migration config for version ${version} not found.`);
    }

    // Acquire lock
    const canLock = await this.lock();
    if (!canLock) {
      throw new Error("Could not acquire lock for re-run.");
    }

    try {
      await this.run(direction, config);
      // Decide if you change version or not. Typically, re-run doesn’t alter the version
      const current = await this.getVersion();
      await this.unlock(current);
    } catch (error) {
      // Unlock but do not update version
      await this.updateStatus({ locked: false, lockedAt: undefined });
      throw error;
    }
  }

  /**
   * Migrates the system to a specific target version.
   */
  public async migrateTo(targetVersion: number): Promise<void> {
    const currentVersion = await this.getVersion();
    if (currentVersion === targetVersion) {
      // Already there, do nothing
      return;
    }

    const canLock = await this.lock();
    if (!canLock) {
      throw new Error(
        "Could not acquire lock. Migration is already in progress."
      );
    }

    try {
      if (targetVersion > currentVersion) {
        // Migrate up in ascending order
        const toMigrate = this.migrationConfigs.filter(
          (m) => m.version > currentVersion && m.version <= targetVersion
        );
        toMigrate.sort((a, b) => a.version - b.version);

        for (const config of toMigrate) {
          await this.run("up", config);
        }
      } else {
        // Migrate down in descending order
        const toMigrate = this.migrationConfigs.filter(
          (m) => m.version <= currentVersion && m.version > targetVersion
        );
        toMigrate.sort((a, b) => b.version - a.version);

        for (const config of toMigrate) {
          await this.run("down", config);
        }
      }

      await this.unlock(targetVersion);
    } catch (error) {
      // On error, unlock (but don’t update version)
      await this.updateStatus({ locked: false, lockedAt: undefined });
      throw error;
    }
  }
}
