import { parse, ScheduleData } from "later";
import { ContainerInstance } from "@bluelibs/core";
import { ObjectID } from "@bluelibs/mongo-bundle";

export interface ICronConfig {
  name: string;
  schedule: (parser) => ScheduleData;
  job: (container: ContainerInstance) => void | Promise<void>;
  persist?: boolean;
  _timer?: any;
}

export interface ICronEntry {
  _id?: ObjectID;
  intendedAt: Date;
  name: string;
  startedAt: Date;
  finishedAt?: Date;
  result?: any;
}

export type XCronBundleConfigType = {
  crons?: ICronConfig[];
};

export interface ICronModel {
  intendedAt: Date;
}
