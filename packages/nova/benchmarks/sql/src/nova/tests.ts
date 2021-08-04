import { db } from "./db";
import { query, lookup } from "@bluelibs/nova";
import * as Benchmark from "benchmark";
import { ITestSuite } from "../common";
import { GROUPS } from "../constants";

export const suites: ITestSuite[] = [
  {
    name: "Full Database Dump - Users",
    async run() {
      return await query(db.Users, {
        _id: 1,
        email: 1,
        name: 1,
        groups: {
          _id: 1,
          name: 1,
        },
        posts: {
          _id: 1,
          title: 1,
          description: 1,
          category: {
            _id: 1,
            name: 1,
          },
          tags: {
            _id: 1,
            name: 1,
          },
          comments: {
            _id: 1,
            text: 1,
            postId: 1, // ALERT REMOVE
            user: {
              email: 1,
            },
          },
        },
      }).toArray();
    },
  },
  {
    name: "Full Database Dump - Users (no projection)",
    async run() {
      return await query(db.Users, {
        $all: true,
        groups: {
          $all: true,
        },
        posts: {
          $all: true,
          category: {
            $all: true,
          },
          tags: {
            $all: true,
          },
          comments: {
            $all: true,
            user: {
              $all: true,
            },
          },
        },
      }).toArray();
    },
  },
  {
    name: "Users with groups",
    async run() {
      return await query(db.Users, {
        _id: 1,
        name: 1,
        email: 1,
        groups: {
          name: 1,
        },
      }).toArray();
    },
  },
  {
    name: "Posts with tags, comments and users email",
    async run() {
      return await query(db.Posts, {
        _id: 1,
        title: 1,
        description: 1,
        tags: {
          _id: 1,
          name: 1,
        },
        comments: {
          _id: 1,
          text: 1,
          user: {
            _id: 1,
            name: 1,
            email: 1,
          },
        },
      }).toArray();
    },
  },
  {
    name: "Full Database Dump - Comments",
    async run() {
      return await query(db.Comments, {
        text: 1,
        user: {
          _id: 1,
          email: 1,
          groups: {
            _id: 1,
            name: 1,
          },
        },
        post: {
          _id: 1,
          title: 1,
          description: 1,
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
          },
        },
      }).toArray();
    },
  },
  {
    name: "Get all posts that belong to users in a specific group",
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
        description: 1,
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
          name: 1,
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
        description: 1,
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
          name: 1,
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
