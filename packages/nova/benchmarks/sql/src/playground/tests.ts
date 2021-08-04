import { db } from "./db";
import { query, lookup } from "@bluelibs/nova";
import * as Benchmark from "benchmark";
import { ITestSuite } from "../common";
import { GROUPS } from "../constants";

export function createSuites(): ITestSuite[] {
  // const q = query(db.UserGameStats, {
  //   username: 1,
  //   email: 1,
  //   scrap: 1,
  //   energy: {
  //     timestamp: 1,
  //     value: 1,
  //   },
  //   food: {
  //     cooldown: 1,
  //   },
  //   expedition: {
  //     cooldown: 1,
  //     unlocked: 1,
  //   },
  //   equipped: {
  //     pet: 1,
  //     car: 1,
  //     hand: 1,
  //     offhand: 1,
  //     head: 1,
  //     chest: 1,
  //     boots: 1,
  //   },
  //   location: {
  //     id: 1,
  //     arriveAt: 1,
  //   },
  //   stats: {
  //     intelligence: {
  //       exp: 1,
  //       level: 1,
  //     },
  //     agility: {
  //       level: 1,
  //       exp: 1,
  //     },
  //     strength: {
  //       level: 1,
  //       exp: 1,
  //     },
  //     defense: {
  //       level: 1,
  //       exp: 1,
  //     },
  //   },
  // });

  return [
    {
      name: "Test Fetching Bigger Model (Pure Mongo)",
      async run() {
        return await db.UserGameStats.findOne({}, {});
      },
    },
    {
      name: "Test Fetching Bigger Models (Pure Mongo)",
      async run() {
        return await db.UserGameStats.find({}).toArray();
      },
    },
    {
      name: "Test Fetching Bigger Model (Nova)",
      async run() {
        return await query(db.UserGameStats, {
          $all: true,
        }).fetchOne();
      },
    },
    {
      name: "Test Fetching Bigger Models (Nova)",
      async run() {
        return await query(db.UserGameStats, {
          $all: true,
        }).fetch();
      },
    },
  ];
}
