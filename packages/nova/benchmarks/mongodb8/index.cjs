const fs = require("node:fs");
const { MongoClient, ObjectId } = require("mongodb");
const nova = require("../../dist");
const {
  baselineRef,
  baseline,
  compare,
  results,
  monitor,
} = require("./harness.cjs");

if (!process.env.MONGO_URL)
  throw new Error("Set MONGO_URL to an isolated MongoDB benchmark server.");
const client = new MongoClient(process.env.MONGO_URL, {
  monitorCommands: true,
  maxPoolSize: 20,
});
const db = client.db(`nova_benchmark_${Date.now()}_${process.pid}`);
const posts = db.collection("posts"),
  tags = db.collection("tags");
const authors = db.collection("authors"),
  comments = db.collection("comments");
const id = (value) => new ObjectId(value.toString(16).padStart(24, "0"));
let latency = 0;
monitor(client);
async function seed() {
  await tags.insertMany(
    Array.from({ length: 1000 }, (_, i) => ({
      _id: id(i + 1),
      name: `tag-${i}`,
    })),
  );
  await authors.insertMany(
    Array.from({ length: 500 }, (_, i) => ({
      _id: id(i + 1),
      name: `author-${i}`,
    })),
  );
  await posts.insertMany(
    Array.from({ length: 5000 }, (_, i) => ({
      _id: id(i + 1),
      seq: i,
      title: `post-${i}`,
      authorId: id((i % 500) + 1),
      tagsIds: Array.from({ length: 5 }, (_, j) =>
        id(((i + j * 37) % 1000) + 1),
      ),
      description: "x".repeat(512),
    })),
  );
  await comments.insertMany(
    Array.from({ length: 10000 }, (_, i) => ({
      _id: id(i + 1),
      postId: id(Math.floor(i / 100) + 1),
      seq: i % 100,
      text: `comment-${i % 100}`,
    })),
  );
  await posts.createIndex({ seq: 1 });
  await posts.createIndex({ tagsIds: 1 });
  await comments.createIndex({ postId: 1, seq: -1, _id: 1 });
  nova.addLinks(posts, {
    tags: {
      collection: () => tags,
      field: "tagsIds",
      many: true,
      index: false,
    },
    author: { collection: () => authors, field: "authorId", index: false },
    comments: { collection: () => comments, inversedBy: "post", index: false },
  });
  nova.addLinks(tags, {
    posts: { collection: () => posts, inversedBy: "tags", index: false },
  });
  nova.addLinks(comments, {
    post: { collection: () => posts, field: "postId", index: false },
  });
}

async function benchmark() {
  for (const link of ["author", "tags"]) {
    const make = (strategy) => [
      { $match: { seq: { $lt: 200 } } },
      nova.lookup(posts, link, { strategy }),
      { $unwind: `$${link}` },
      { $sort: { _id: 1, [`${link}._id`]: 1 } },
      { $project: { _id: 1, [`${link}._id`]: 1 } },
    ];
    await compare(
      `lookup-${link}`,
      ["pipeline", "equality"].map((strategy) => ({
        name: strategy,
        run: () => posts.aggregate(make(strategy)).toArray(),
      })),
    );
  }
  const body = {
    $: { filters: { seq: { $lt: 100 } }, options: { sort: { seq: 1 } } },
    _id: 1,
    title: 1,
    comments: {
      $: { options: { sort: { seq: -1, _id: 1 }, limit: 3, skip: 2 } },
      _id: 1,
      postId: 1,
      seq: 1,
      text: 1,
    },
  };
  const fetch = () => nova.query(posts, body).fetch();
  const variants = [
    { name: "baseline sequential", run: () => baseline(fetch) },
    { name: "production batched pagination", run: fetch },
    {
      name: "production functional fallback",
      run: () =>
        nova
          .query(posts, {
            ...body,
            comments: { ...body.comments, $: () => body.comments.$ },
          })
          .fetch(),
    },
  ];
  await compare("top-3-per-parent-local", variants);
  // Simulate extra logical-request latency, including every batch. This is not a WAN measurement.
  const originals = new Map();
  for (const collection of [posts, comments]) {
    originals.set(collection, collection.aggregate);
    collection.aggregate = function (...args) {
      const cursor = originals.get(collection).apply(this, args);
      const toArray = cursor.toArray;
      cursor.toArray = async function () {
        await new Promise((resolve) => setTimeout(resolve, latency));
        return toArray.call(this);
      };
      return cursor;
    };
  }
  try {
    latency = 5;
    await compare("top-3-per-parent-added-5ms-per-request", variants, 5);
  } finally {
    for (const [collection, original] of originals)
      collection.aggregate = original;
  }

  const graphBody = {
    $: { filters: { seq: { $lt: 200 } } },
    title: 1,
    author: { name: 1 },
    tags: { name: 1 },
  };
  await compare("ordinary-batched-graph", [
    {
      name: "baseline",
      run: () => baseline(() => nova.query(posts, graphBody).fetch()),
    },
    { name: "production", run: () => nova.query(posts, graphBody).fetch() },
  ]);
  const inverseBody = { name: 1, posts: { title: 1, tagsIds: 1 } };
  await compare(
    "inverse-many-1000-parents-5000-children",
    [
      {
        name: "baseline repeated scans",
        run: () => baseline(() => nova.query(tags, inverseBody).fetch()),
      },
      {
        name: "production membership map",
        run: () => nova.query(tags, inverseBody).fetch(),
      },
    ],
    6,
  );
}

(async () => {
  await client.connect();
  const build = await db.admin().command({ buildInfo: 1 });
  const metadata = {
    mongodb: build.version,
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    driver: require("mongodb/package.json").version,
    baseline: baselineRef,
    fixture: {
      parentsForPagination: 100,
      commentsPerParent: 100,
      posts: 5000,
      tags: 1000,
    },
    methodology:
      "Three warmups per variant, rotating measurement order, exact output equality; maxCap omitted.",
  };
  console.log(JSON.stringify(metadata));
  await seed();
  await benchmark();
  if (process.env.NOVA_BENCHMARK_OUTPUT)
    fs.writeFileSync(
      process.env.NOVA_BENCHMARK_OUTPUT,
      JSON.stringify({ metadata, results }, null, 2),
    );
})()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await db.dropDatabase();
    } finally {
      await client.close();
    }
  });
