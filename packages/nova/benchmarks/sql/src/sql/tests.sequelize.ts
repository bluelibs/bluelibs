import * as db from "./db";
import { queryBuilder } from "./db";
import { query } from "@bluelibs/nova";
import { ITestSuite } from "../common";
import { GROUPS } from "../constants";

export const suites: ITestSuite[] = [
  {
    name: "Full Database Dump - Users",
    async run() {
      const result = await db.User.findAll({
        attributes: ["email", "id"],
        include: [
          {
            model: db.Group,
            as: "groups",
            attributes: ["name", "id"],
          },
          {
            attributes: ["title", "description", "id"],
            model: db.Post,
            as: "posts",
            include: [
              {
                model: db.Tag,
                as: "tags",
                attributes: ["name", "id"],
              },
              {
                model: db.PostCategory,
                as: "postCategory",
                attributes: ["name", "id"],
              },
              {
                model: db.Comment,
                attributes: ["text", "id"],
                as: "comments",
                include: [
                  {
                    attributes: ["email", "name", "id"],
                    model: db.User,
                    as: "user",
                  },
                ],
              },
            ],
          },
        ],
      });

      return result;
    },
  },
  {
    name: "Users with groups",
    async run() {
      const result = await db.User.findAll({
        attributes: ["email", "name", "id"],
        include: [
          {
            model: db.Group,
            as: "groups",
            attributes: ["name", "id"],
          },
        ],
      });

      return result;
    },
  },
  {
    name: "Posts with tags, comments and comment users email",
    async run() {
      const result = await db.Post.findAll({
        attributes: ["title", "description", "id"],
        where: {},
        include: [
          {
            model: db.Tag,
            as: "tags",
            attributes: ["name", "id"],
          },
          {
            model: db.Comment,
            as: "comments",
            attributes: ["text", "id"],
            include: [
              {
                model: db.User,
                as: "user",
                attributes: ["email", "name", "id"],
              },
            ],
          },
        ],
      });

      return result;
    },
  },
  {
    name: "Full Database Dump - Comments",
    async run() {
      const result = await db.Comment.findAll({
        attributes: ["text", "id"],
        include: [
          {
            model: db.User,
            as: "user",
            attributes: ["email", "name", "id"],
            include: [
              {
                model: db.Group,
                as: "groups",
                attributes: ["name", "id"],
              },
            ],
          },
          {
            attributes: ["title", "description", "id"],
            model: db.Post,
            as: "post",
            include: [
              {
                model: db.Tag,
                as: "tags",
                attributes: ["name", "id"],
              },
              {
                model: db.PostCategory,
                as: "postCategory",
                attributes: ["name", "id"],
              },
              {
                model: db.User,
                as: "user",
                attributes: ["email", "name", "id"],
              },
            ],
          },
        ],
      });

      return result;
    },
  },
  {
    name: "Get all posts that belong to users in a specific group",
    async run() {
      const result = await db.Post.findAll({
        attributes: ["title", "description"],
        where: {},
        include: [
          {
            model: db.Tag,
            as: "tags",
            attributes: ["name"],
          },
          {
            model: db.PostCategory,
            as: "postCategory",
            attributes: ["name"],
          },
          {
            model: db.User,
            as: "user",
            attributes: ["email", "name"],
            required: true,
            include: [
              {
                model: db.Group,
                as: "groups",
                attributes: ["name"],
                where: {
                  name: GROUPS[0],
                },
                required: true,
              },
            ],
          },
        ],
      });

      return result;
    },
  },
  {
    name: "Get all posts sorted by category name",
    async run() {
      const result = await db.Post.findAll({
        attributes: ["title", "description"],
        where: {},
        order: [["postCategory", "name", "ASC"]],
        include: [
          {
            model: db.Tag,
            as: "tags",
            attributes: ["name", "id"],
          },
          {
            model: db.PostCategory,
            as: "postCategory",
            attributes: ["name", "id"],
          },
          {
            model: db.User,
            as: "user",
            attributes: ["email", "name", "id"],
            include: [
              {
                model: db.Group,
                as: "groups",
                attributes: ["name", "id"],
              },
            ],
          },
        ],
      });

      return result;
    },
  },
];
