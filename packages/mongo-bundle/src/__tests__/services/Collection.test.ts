import { getEcosystem } from "../helpers";
import { Comments, Comment } from "./dummy/comments";
import { Posts, Post } from "./dummy/posts";
import { Users, User } from "./dummy/users";
import { AfterDeleteEvent } from "../../events";
import { DatabaseService } from "../../services/DatabaseService";
import {
  BeforeInsertEvent,
  AfterInsertEvent,
  BeforeUpdateEvent,
  AfterUpdateEvent,
} from "../../events";
import { EJSON } from "@bluelibs/ejson";
import { ObjectId } from "mongodb";

describe("Collection", () => {
  test("Should dispatch events properly", async () => {
    const { container } = await getEcosystem();

    const comments = container.get<Comments>(Comments);

    let lifecycle = {
      beforeInsert: false,
      afterInsert: false,
      beforeUpdate: false,
      afterUpdate: false,
      beforeDelete: false,
      afterDelete: false,
    };

    comments.on(BeforeInsertEvent, (e: BeforeInsertEvent) => {
      lifecycle.beforeInsert = true;
    });

    comments.on(AfterInsertEvent, (e: AfterInsertEvent) => {
      lifecycle.afterInsert = true;
    });

    comments.on(BeforeUpdateEvent, (e: BeforeUpdateEvent) => {
      lifecycle.beforeUpdate = true;
    });

    comments.on(AfterUpdateEvent, (e: AfterUpdateEvent) => {
      lifecycle.afterUpdate = true;
    });

    comments.on(AfterDeleteEvent, (e: AfterDeleteEvent) => {
      lifecycle.beforeDelete = true;
    });

    comments.on(AfterDeleteEvent, (e: AfterDeleteEvent) => {
      lifecycle.afterDelete = true;
    });

    const c1 = await comments.insertOne({ title: "Lifecycle test" });

    await comments.updateOne(
      { _id: c1.insertedId },
      {
        $set: {
          title: "Lifecycle Updated",
        },
      }
    );

    await comments.deleteOne({ _id: c1.insertedId });

    expect(lifecycle.beforeInsert).toBe(true);
    expect(lifecycle.afterInsert).toBe(true);
    expect(lifecycle.beforeUpdate).toBe(true);
    expect(lifecycle.afterUpdate).toBe(true);
    expect(lifecycle.beforeDelete).toBe(true);
    expect(lifecycle.afterDelete).toBe(true);
  });

  test("Should work with nova integration", async () => {
    const { container } = await getEcosystem();

    const comments = container.get<Comments>(Comments);
    const posts = container.get<Posts>(Posts);
    const users = container.get<Users>(Users);

    const u1 = await users.insertOne({
      name: "John",
    });

    const p1 = await posts.insertOne({
      title: "John Post",
      authorId: u1.insertedId,
    });

    const c1 = await comments.insertOne({
      title: "Hello",
      userId: u1.insertedId,
      postId: p1.insertedId,
    });

    const c2 = await comments.insertOne({
      title: "Is it me you're looking for?",
      userId: u1.insertedId,
      postId: p1.insertedId,
    });

    const foundUsers = await users.query({
      $: {
        filters: {
          _id: u1.insertedId,
        },
      },
      name: 1,
      comments: {
        title: 1,
      },
      posts: {
        title: 1,
        comments: {
          _id: 1,
          title: 1,
        },
      },
    });

    expect(foundUsers).toHaveLength(1);
    const foundUser = foundUsers[0];

    expect(foundUser).toBeInstanceOf(User);
    expect(foundUser.comments).toHaveLength(2);

    expect(foundUser.posts).toHaveLength(1);
  });

  test("Should prevent execution/update when event listeners throw", async () => {
    const { container } = await getEcosystem();
    const posts = container.get<Posts>(Posts);

    const errorHandler = async () => {
      throw new Error();
    };
    posts.on(BeforeUpdateEvent, errorHandler);

    const p1 = await posts.insertOne({
      title: "new",
    });

    expect(
      posts.updateOne(
        {
          _id: p1.insertedId,
        },
        {
          $set: {
            title: "new2",
          },
        }
      )
    ).rejects.toBeInstanceOf(Error);

    const post = await posts.queryOne({
      $: {
        filters: {
          _id: p1.insertedId,
        },
      },
      title: 1,
    });

    expect(post.title).toBe("new");

    await posts.deleteOne({
      _id: p1.insertedId,
    });

    posts.localEventManager.removeListener(BeforeUpdateEvent, errorHandler);
  });

  test("Should work with indexes", async () => {
    const { container } = await getEcosystem();
    const posts = container.get(Posts);

    const result = await posts.collection.listIndexes().toArray();

    // for _id and for authorId, tagsIds
    expect(result).toHaveLength(3);
  });

  test("Should work with find and findOne", async () => {
    const { container } = await getEcosystem();
    const posts = container.get(Posts);

    await posts.deleteMany({});

    const p1 = await posts.insertOne({ title: "hello" });

    const postObjects = await posts.find({}).toArray();
    expect(postObjects).toHaveLength(1);
    expect(postObjects[0]).toBeInstanceOf(Post);

    const postObject = await posts.findOne({});
    expect(postObject).toBeInstanceOf(Post);
  });

  test("Should work with findOneAndSTUFF", async () => {
    const { container } = await getEcosystem();
    const posts = container.get(Posts);

    await posts.deleteMany({});

    const p1 = await posts.insertOne({ title: "hello", number: 123 });

    let result = await posts.findOneAndUpdate(
      { _id: p1.insertedId },
      {
        $set: {
          title: "hello2",
        },
      }
    );

    expect(result.value).toBeInstanceOf(Post);

    let post = await posts.findOne({});
    expect(post.title).toBe("hello2");

    result = await posts.findOneAndDelete({ _id: p1.insertedId });
    expect(result.value).toBeInstanceOf(Post);
  });

  test("Should work with count", async () => {
    const { container } = await getEcosystem();

    const posts = container.get(Posts);

    const postsCount = await posts.count();

    expect(postsCount).toBe(0);

    const postsToInsertCount = Math.ceil(5 + Math.random() * 10);

    for (let i = 0; i < postsToInsertCount; ++i) {
      await posts.insertOne({
        title: `test-${i}`,
      });
    }

    const allPostsCountAfterInsert = await posts.count();
    const postsCountWithGivenTitle = await posts.count({
      title: "test-1",
    });

    const postsCountLimit5 = await posts.count(
      {},
      {
        limit: 5,
      }
    );

    expect(allPostsCountAfterInsert).toBe(postsToInsertCount);
    expect(postsCountWithGivenTitle).toBe(1);
    expect(postsCountLimit5).toBe(5);
  });

  test("Should work with count when having softdeletable behavior (deleteOne, deleteMany)", async () => {
    const { container } = await getEcosystem();

    const comments = container.get(Comments);

    const _id = (await comments.insertOne({ title: "test" })).insertedId;
    await comments.deleteOne({ _id });

    const commentsCount = await comments.count();
    expect(commentsCount).toBe(0);

    const randomNumberOfComments = Math.ceil(5 + Math.random() * 10);

    const commentsArray = new Array<Comment>(randomNumberOfComments)
      .fill(null)
      .map(
        (_, index) =>
          ({
            title: `test-${index}`,
          } as Comment)
      );

    await comments.insertMany(commentsArray);

    expect(await comments.count()).toBe(randomNumberOfComments);

    await comments.deleteMany({});

    expect(await comments.count()).toBe(0);
  });

  test("Should work with transactions", async () => {
    const { container } = await getEcosystem();

    const dbService = container.get(DatabaseService);
    const comments = container.get(Comments);

    await dbService.transact(async (session) => {
      const _id = (await comments.insertOne({ title: "test" })).insertedId;
      let obj = await comments.queryOne(
        {
          $: {
            filters: { _id },
          },
          title: 1,
        },
        session
      );

      expect(obj.title).toBe("test");

      await comments.updateOne(
        { _id },
        {
          $set: {
            title: "test2",
          },
        }
      );

      obj = await comments.queryOne(
        {
          $: {
            filters: { _id },
          },
          title: 1,
        },
        session
      );

      expect(obj.title).toBe("test2");
    });
  });

  test.only("Should work with nova integration", async () => {
    const { container } = await getEcosystem();

    const comments = container.get<Comments>(Comments);
    const posts = container.get<Posts>(Posts);
    const users = container.get<Users>(Users);

    const u1 = await users.insertOne({
      name: "John",
    });

    const result = await users.queryOne({
      $: { filters: { _id: u1.insertedId } },
      _id: 1,
    });

    console.log(result._id instanceof ObjectId);

    console.log(EJSON.stringify(result));
    console.log({ result });
  });
});
