import * as expect from "expect";
import { COMMENT_TEXT } from "./constants";
import {
  POST_PER_USER,
  COMMENTS_PER_POST,
  GROUPS,
  USERS_COUNT,
} from "./constants";

export const sanity = {
  "Full Database Dump - Users"(result) {
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(USERS_COUNT);

    for (const user of result) {
      expect(typeof user.name).toBe("string");
      expect(user.posts).toHaveLength(POST_PER_USER);
      expect(user.groups).toHaveLength(1);
      expect(typeof user.groups[0].name).toBe("string");
      for (const post of user.posts) {
        expect(post.description).toBeTruthy();
        expect(post.comments).toHaveLength(COMMENTS_PER_POST);
        for (const comment of post.comments) {
          expect(comment.text).toBe(COMMENT_TEXT);
          expect(typeof comment.user.email).toBe("string");
        }
      }
    }
  },
  "Posts with tags, comments and users email"(result) {
    expect(result).toHaveLength(USERS_COUNT * POST_PER_USER);
  },
  "Get all posts that belong to users in a specific group"(result) {
    expect(Array.isArray(result)).toBe(true);
    for (const post of result) {
      expect(post.user).toBeTruthy();
      expect(typeof post.user.email === "string").toBe(true);
      expect(post.user.groups.length === 1).toBe(true);
      expect(post.user.groups[0].name).toBe(GROUPS[0]);
    }
  },
  "Get all posts sorted by category name"(result) {
    expect(result).toHaveLength(USERS_COUNT * POST_PER_USER);
    const categoryNames = result.map(
      (post) => post.category?.name || post.postCategory?.name
    );

    expect(categoryNames[0]).toBe("JavaScript");
    expect(categoryNames[categoryNames.length - 1]).toBe("React");
  },
} as const;
