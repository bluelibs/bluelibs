import * as db from "./db";
import * as _ from "lodash";
import {
  TAGS,
  GROUPS,
  POST_CATEGORIES,
  POST_PER_USER,
  COMMENTS_PER_POST,
  USERS_COUNT,
} from "../constants";
import { createRandomUser, createRandomPost, createComment } from "../common";

export async function runFixtures() {
  await db.sequelize.authenticate();
  await db.sequelize.drop();
  await db.sequelize.sync();

  // const foundUsers = await db.User.findAll();
  // if (!FORCE_FIXTURES) {
  //   if (foundUsers.length) {
  //     console.log(
  //       "[ok] we are no longer loading fixtures, we found users, we assume they are loaded"
  //     );
  //     return;
  //   }
  // }

  // console.log("[ok] now started to load fixtures, patience padawan!");

  let tags = [];
  for (let i in TAGS) {
    const tag = await db.Tag.create({ name: TAGS[i] });
    tags.push(tag);
  }

  let groups = [];
  for (let i in GROUPS) {
    const group = await db.Group.create({ name: GROUPS[i] });
    groups.push(group);
  }

  let categories = [];
  for (let i in POST_CATEGORIES) {
    const category = await db.PostCategory.create({ name: POST_CATEGORIES[i] });
    categories.push(category);
  }

  let users = [];
  for (let i = 0; i < USERS_COUNT; i++) {
    const user = await db.User.create(createRandomUser());

    users.push(user);
  }

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    console.log("Handling user:", user.id);
    await user.addGroup(groups[i % groups.length]);

    for (let j = 0; j < POST_PER_USER; j++) {
      let post = await db.Post.create(createRandomPost(j));

      /* @ts-ignore */
      await post.setPostCategory(categories[j % categories.length]);
      /* @ts-ignore */
      await post.setUser(user);
      /* @ts-ignore */
      await post.addTag(tags[j % tags.length]);

      for (let k = 0; k < COMMENTS_PER_POST; k++) {
        let comment = await db.Comment.create(createComment());

        /* @ts-ignore */
        await comment.setPost(post);
        /* @ts-ignore */
        await comment.setUser(users[k % users.length]);
      }
    }
  }

  console.log("[ok] fixtures have been loaded.");
}
