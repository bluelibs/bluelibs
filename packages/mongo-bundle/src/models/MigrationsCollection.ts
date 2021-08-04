import { Collection } from "./Collection";

export interface IMigrationStatus {
  _id: string | any;
  version: number;
  locked: boolean;
  lockedAt?: Date;
  lastError?: {
    fromVersion: number;
    message: string;
  };
}

export class MigrationsCollection extends Collection<IMigrationStatus> {
  static collectionName = "migrations";
}
