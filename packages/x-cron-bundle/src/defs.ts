import { ParseStatic, ScheduleData } from "later";
import { ContainerInstance } from "@bluelibs/core";
import { ObjectID } from "@bluelibs/mongo-bundle";

export interface ICronConfig {
  name: string;
  schedule: (parser: ParseStatic) => ScheduleData;
  job: (container: ContainerInstance) => void | Promise<void>;
  persist?: boolean;
  _timer?: { clear(): void };
}

export interface ICronEntry {
  _id?: ObjectID;
  intendedAt: Date;
  name: string;
  startedAt: Date;
  finishedAt?: Date;
  result?: unknown;
}

export type XCronBundleConfigType = {
  crons?: ICronConfig[];
};

export interface ICronModel {
  intendedAt: Date;
}
