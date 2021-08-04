import {
  TAGS,
  GROUPS,
  POST_CATEGORIES,
  POST_PER_USER,
  COMMENTS_PER_POST,
  USERS_COUNT,
} from "../constants";
import { db } from "./db";
import { createRandomUser, createRandomPost, createComment } from "../common";
import { Collection } from "mongodb";

export async function getNextId(
  collection: Collection
): Promise<{ [key: string]: any }> {
  const result = (await collection.find().count()) + 1;
  return { _id: result };
}

export async function runFixtures() {
  for (const collKey in db) {
    console.log(`Deleting all documents from: "${collKey}"`);
    await db[collKey].deleteMany({});
  }

  console.log("[ok] now started to load fixtures, patience padawan!");

  for (let i = 0; i < 1000; i++) {
    await db.UserGameStats.insertOne({
      username: "test",
      email: "test@test.com",
      scrap: 150,
      energy: {
        timestamp: new Date(),
        value: 5000,
      },
      food: {
        cooldown: 40,
      },
      expedition: {
        cooldown: 50,
        unlocked: true,
      },
      equipped: {
        pet: true,
        car: false,
        hand: true,
        offhand: false,
        head: true,
        chest: true,
        boots: false,
      },
      location: {
        id: 5,
        arriveAt: new Date(),
      },
      stats: {
        intelligence: {
          exp: 400,
          level: 10,
        },
        agility: {
          level: 5,
          exp: 40,
        },
        strength: {
          level: 20,
          exp: 60,
        },
        defense: {
          level: 1,
          exp: 100,
        },
      },
    });
  }

  console.log("[ok] fixtures have been loaded.");
}
