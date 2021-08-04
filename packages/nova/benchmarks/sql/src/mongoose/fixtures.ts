import {
  RUN_FIXTURES,
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
    await db[collKey].deleteMany({});
    console.log(`Deleted all documents from: "${collKey}"`);
  }

  console.log("[ok] now started to load fixtures, patience padawan!");

  const tags = [];
  for (const name of TAGS) {
    const result = await db.Tags.insertOne({
      ...(await getNextId(db.Tags)),
      name,
    });
    tags.push(await db.Tags.findOne({ _id: result.insertedId }));
  }

  const groups = [];
  for (const name of GROUPS) {
    const result = await db.Groups.insertOne({
      ...(await getNextId(db.Groups)),
      name,
    });
    groups.push(await db.Groups.findOne({ _id: result.insertedId }));
  }

  const categories = [];
  for (const name of POST_CATEGORIES) {
    const result = await db.PostsCategories.insertOne({
      ...(await getNextId(db.PostsCategories)),
      name,
    });
    categories.push(
      await db.PostsCategories.findOne({ _id: result.insertedId })
    );
  }

  let users = [];
  for (let i = 0; i < USERS_COUNT; i++) {
    const user = await db.Users.insertOne({
      ...createRandomUser(),
      groups: [groups[i % groups.length]._id],
      ...(await getNextId(db.Users)),
    });
    users.push(await db.Users.findOne({ _id: user.insertedId }));
  }

  console.log("Completed users");

  for (const user of users) {
    console.log("Handling user:", user);
    for (let postIndex = 0; postIndex < POST_PER_USER; postIndex++) {
      const post = createRandomPost(postIndex);
      const result = await db.Posts.insertOne({
        ...post,
        user: user._id,
        category: categories[postIndex % categories.length]._id,
        tags: [tags[postIndex % tags.length]._id],
        ...(await getNextId(db.Posts)),
      });

      // CREATE COMMENTS FOR EACH POST
      for (
        let commentIndex = 0;
        commentIndex < COMMENTS_PER_POST;
        commentIndex++
      ) {
        await db.Comments.insertOne({
          ...(await getNextId(db.Comments)),
          post: result.insertedId,
          user: users[commentIndex % users.length]._id,
          ...createComment(),
        });
      }
    }
  }

  console.log("[ok] fixtures have been loaded.");
}
