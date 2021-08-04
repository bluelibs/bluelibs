import { db, mongooseModels } from "./db";
import { query, lookup } from "@bluelibs/nova";
import * as Benchmark from "benchmark";
import { ITestSuite } from "../common";
import { GROUPS } from "../constants";

export const suites: ITestSuite[] = [
  {
    name: "Full Database Dump - Users",
    async run() {
      const results = await mongooseModels.User.find({}, "email name")
        .populate({
          path: "groups",
          select: "name",
        })
        .populate({
          path: "posts",
          select: "title description",
          populate: [
            {
              path: "category",
              select: "name",
            },
            {
              path: "tags",
              select: "name",
            },
            {
              path: "comments",
              select: "text",
              populate: {
                path: "user",
                select: "email name",
              },
            },
          ],
        })
        .exec();

      return results;
    },
  },
  {
    name: "Users with groups",
    async run() {
      const results = await mongooseModels.User.find({}, "email name")
        .populate({
          path: "groups",
          select: "name",
        })
        .exec();

      return results;
    },
  },
  {
    name: "Posts with tags, comments and users email",
    async run() {
      const results = await mongooseModels.Post.find({}, "title description")
        .populate({
          path: "tags",
          select: "name",
        })
        .populate({
          path: "comments",
          select: "text",
          populate: {
            path: "user",
            select: "email name",
          },
        })
        .exec();

      return results;
    },
  },
  {
    name: "Full Database Dump - Comments",
    async run() {
      const results = await mongooseModels.Comment.find({}, "text")
        .populate({
          path: "user",
          select: "email",
          populate: {
            path: "groups",
            select: "name",
          },
        })
        .populate({
          path: "post",
          select: "title description",
          populate: [
            {
              path: "category",
              select: "name",
            },
            {
              path: "tags",
              select: "name",
            },
            {
              path: "user",
              select: "email name",
            },
          ],
        })
        .exec();

      return results;
    },
  },
  {
    name: "Get all posts that belong to users in a specific group",
    // Don't know how to do it with mongoose
    skip: true,
    async run() {
      const group = await db.Groups.findOne(
        { name: GROUPS[0] },
        {
          projection: {
            _id: 1,
          },
        }
      );

      const users = await db.Users.find(
        {
          groupsIds: group._id,
        },
        {
          projection: {
            _id: 1,
          },
        }
      ).toArray();

      const userIds = users.map((user) => user._id);

      const result = await query(db.Posts, {
        $: {
          filters: {
            userId: {
              $in: userIds,
            },
          },
          // The lookup alternative is usually much slower because it uses the built-in MongoDB aggregator
          // Sometimes its far better and you have more clarity with this approach

          // pipeline: [
          //   // This performs the link from Employees to "company"
          //   // You don't have to worry about how it's linked, you will use your natural language
          //   lookup(db.Posts, "user", {
          //     pipeline: [
          //       lookup(db.Users, "groups"),
          //       {
          //         $match: {
          //           "groups.name": GROUPS[0],
          //         },
          //       },
          //     ],
          //   }),
          //   {
          //     $match: {
          //       "user.groups.name": GROUPS[0],
          //     },
          //   },
          // ],
        },
        _id: 1,
        title: 1,
        category: {
          _id: 1,
          name: 1,
        },
        tags: {
          _id: 1,
          name: 1,
        },
        user: {
          _id: 1,
          email: 1,
          groups: {
            _id: 1,
            name: 1,
          },
        },
      }).toArray();

      return result;
    },
  },
  {
    name: "Get all posts sorted by category name",
    skip: true, // how do this in mongoose?
    async run() {
      const result = await query(db.Posts, {
        $: {
          pipeline: [
            lookup(db.Posts, "category"),
            {
              $sort: {
                "category.name": 1,
              },
            },
          ],
        },

        _id: 1,
        title: 1,
        category: {
          name: 1,
          _id: 1,
        },
        tags: {
          name: 1,
          _id: 1,
        },
        user: {
          email: 1,
          _id: 1,
          groups: {
            _id: 1,
            name: 1,
          },
        },
      }).toArray();

      return result;
    },
  },
];
