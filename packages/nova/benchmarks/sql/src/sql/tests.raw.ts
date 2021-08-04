import * as db from "./db";
import { queryBuilder } from "./db";
import { query } from "@bluelibs/nova";
import { ITestSuite } from "../common";
import { GROUPS } from "../constants";

export const suites: ITestSuite[] = [
  {
    name: "Full Database Dump - Users",
    async run() {
      const result = await queryBuilder
        .join("posts", "posts.userId", "=", "users.id")
        .join(
          "postCategories",
          "posts.postCategoryId",
          "=",
          "postCategories.id"
        )

        // join groups
        .join("UserGroup", "UserGroup.userId", "=", "users.id")
        .join("groups", "groups.id", "=", "UserGroup.groupId")

        // join with tags
        .join("PostTag", "PostTag.postId", "=", "posts.id")
        .join("tags", "tags.id", "=", "PostTag.tagId")

        .join("comments", "comments.postId", "=", "posts.userId")
        .join(
          { commentsUsers: "users" },
          "comments.userId",
          "=",
          "commentsUsers.id"
        )
        .select([
          "users.id as userId",
          "users.email",
          "users.name",
          "posts.id as postId",
          "posts.title",
          "posts.description",
          "postCategories.id as postCategoryId",
          "postCategories.name as postCategoryName",
          "tags.name as postTagName",
          "tags.id as tagId",
          "groups.name as userGroupName",
          "groups.id as groupId",
          "comments.text",
          "comments.id as commentId",
          "commentsUsers.email as commentUserEmail",
          "commentsUsers.id as commentUserId",
        ])
        .from("users");

      return result;
    },
  },
  {
    name: "Users with groups",
    async run() {
      const result = await queryBuilder
        // join groups

        .join("UserGroup", "UserGroup.userId", "=", "users.id")
        .join("groups", "groups.id", "=", "UserGroup.groupId")

        .select([
          "users.name",
          "users.email",
          "users.id",
          "groups.name",
          "groups.id as groupId",
        ])
        .from("users");

      // // const query = queryBuilder.select(["users.email"]).from("users");

      return result;
    },
  },
  {
    name: "Posts with tags, comments and comment users email",
    async run() {
      const result = queryBuilder
        .join("comments", "comments.postId", "=", "posts.id")
        .join("users", "comments.userId", "=", "users.id")

        // join with tags
        .join("PostTag", "PostTag.postId", "=", "posts.id")
        .join("tags", "tags.id", "=", "PostTag.tagId")

        .select([
          "posts.id as postId",
          "posts.title",
          "posts.description",
          "tags.id as tagId",
          "tags.name as postTagName",
          "comments.id as commentId",
          "users.email as commentUserEmail",
          "users.id as commentUserId",
        ])
        .from("posts");

      return await result;
    },
  },
  {
    name: "Full Database Dump - Comments",
    async run() {
      const result = await queryBuilder
        .join("posts", "comments.postId", "=", "posts.id")
        .join("users", "comments.userId", "=", "users.id")
        .join(
          "postCategories",
          "posts.postCategoryId",
          "=",
          "postCategories.id"
        )

        // join groups
        .join("UserGroup", "UserGroup.userId", "=", "users.id")
        .join("groups", "groups.id", "=", "UserGroup.groupId")

        // join with tags
        .join("PostTag", "PostTag.postId", "=", "posts.id")
        .join("tags", "tags.id", "=", "PostTag.tagId")

        .select([
          "posts.id as postId",
          "comments.id as commentId",
          "postCategories.id as postCategories.id",
          "comments.text",
          "posts.title",
          "posts.description",
          "postCategories.name as postCategoryName",
          "tags.id as postTagId",
          "tags.name as postTagName",
          "groups.id as userGroupId",
          "groups.name as userGroupName",
          "users.email as commentUserEmail",
          "users.name as commentUserName",
          "users.id as commentUserId",
        ])
        .from("comments");

      return result;
    },
  },

  {
    name: "Get all posts that belong to users in a specific group",
    async run() {
      const result = await queryBuilder
        .join("users", "posts.userId", "=", "users.id")
        .join(
          "postCategories",
          "posts.postCategoryId",
          "=",
          "postCategories.id"
        )

        // join groups
        .join("UserGroup", "UserGroup.userId", "=", "users.id")
        .join("groups", "groups.id", "=", "UserGroup.groupId")

        // join with tags
        .join("PostTag", "PostTag.postId", "=", "posts.id")
        .join("tags", "tags.id", "=", "PostTag.tagId")

        .where("groups.name", "=", GROUPS[0])

        .select([
          "posts.id as postId",
          "postCategories.id as postCategoryId",
          "tags.id as tagId",
          "users.id as postUserId",
          "groups.id as userGroupId",
          "posts.title",
          "posts.description",
          "postCategories.name as postCategoryName",
          "tags.name as postTagName",
          "users.email as postUserEmail",
          "users.name as postUserName",
          "groups.name as userGroupName",
        ])
        .from("posts");

      return result;
    },
  },
  {
    name: "Get all posts sorted by category name",
    async run() {
      const result = await queryBuilder
        .join("users", "posts.userId", "=", "users.id")
        .join(
          "postCategories",
          "posts.postCategoryId",
          "=",
          "postCategories.id"
        )

        // join groups
        .join("UserGroup", "UserGroup.userId", "=", "users.id")
        .join("groups", "groups.id", "=", "UserGroup.groupId")

        // join with tags
        .join("PostTag", "PostTag.postId", "=", "posts.id")
        .join("tags", "tags.id", "=", "PostTag.tagId")

        .where("groups.name", "=", GROUPS[0])

        .select([
          "posts.id as postId",
          "tags.id as tagId",
          "groups.id as userGroupId",
          "posts.title",
          "posts.description",
          "postCategories.name as postCategoryName",
          "tags.name as postTagName",
          "users.email as postUserEmail",
          "users.name as postUserName",
          "groups.name as userGroupName",
        ])
        .orderBy("postCategories.name")
        .from("posts");

      return result;
    },
  },
];
