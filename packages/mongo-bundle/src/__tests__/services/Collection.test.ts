import { createEcosystem } from "../helpers";
import { Comments, Comment } from "./dummy/comments";
import { Posts, Post } from "./dummy/posts";
import { Users, User } from "./dummy/users";
import { assert, expect } from "chai";
import {
  BeforeInsertEvent,
  AfterInsertEvent,
  BeforeUpdateEvent,
  AfterUpdateEvent,
  BeforeRemoveEvent,
  AfterRemoveEvent,
} from "../../events";

describe("Collection", () => {
  it("Should dispatch events properly", async () => {
    const { container, teardown } = await createEcosystem();

    const comments = container.get<Comments>(Comments);

    let lifecycle = {
      beforeInsert: false,
      afterInsert: false,
      beforeUpdate: false,
      afterUpdate: false,
      beforeRemove: false,
      afterRemove: false,
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

    comments.on(BeforeRemoveEvent, (e: BeforeRemoveEvent) => {
      lifecycle.beforeRemove = true;
    });

    comments.on(AfterRemoveEvent, (e: AfterRemoveEvent) => {
      lifecycle.afterRemove = true;
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

    assert.isTrue(lifecycle.beforeInsert);
    assert.isTrue(lifecycle.afterInsert);
    assert.isTrue(lifecycle.beforeUpdate);
    assert.isTrue(lifecycle.afterUpdate);
    assert.isTrue(lifecycle.beforeRemove);
    assert.isTrue(lifecycle.afterRemove);

    await teardown();
  });

  it("Should work with nova integration", async () => {
    const { container, teardown } = await createEcosystem();

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

    assert.lengthOf(foundUsers, 1);
    const foundUser = foundUsers[0];

    assert.instanceOf(foundUser, User);
    assert.lengthOf(foundUser.comments, 2);
    assert.lengthOf(foundUser.posts, 1);

    await teardown();
  });

  it("Should prevent execution/update when event listeners throw", async () => {
    const { container, teardown } = await createEcosystem();
    const posts = container.get<Posts>(Posts);

    posts.on(BeforeUpdateEvent, async () => {
      throw new Error();
    });

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
    ).to.eventually.be.rejectedWith(Error);

    const post = await posts.queryOne({
      $: {
        filters: {
          _id: p1.insertedId,
        },
      },
      title: 1,
    });

    assert.equal(post.title, "new");

    await posts.deleteOne({
      _id: p1.insertedId,
    });

    await teardown();
  });

  it("Should work with indexes", async () => {
    const { container, teardown } = await createEcosystem();
    const posts = container.get(Posts);

    // Give time for indexes to persist
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 500);
    });
    const result = await posts.collection.listIndexes().toArray();

    // for _id and for authorId
    assert.lengthOf(result, 2);
    await teardown();
  });

  it("Should work with find and findOne", async () => {
    const { container, teardown } = await createEcosystem();
    const posts = container.get(Posts);

    await posts.deleteMany({});

    const p1 = await posts.insertOne({ title: "hello" });

    const postObjects = await posts.find({}).toArray();
    assert.lengthOf(postObjects, 1);
    assert.instanceOf(postObjects[0], Post);

    const postObject = await posts.findOne({});
    assert.instanceOf(postObject, Post);

    await teardown();
  });

  it("Should work with findOneAndSTUFF", async () => {
    const { container, teardown } = await createEcosystem();
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

    assert.instanceOf(result.value, Post);

    let post = await posts.findOne({});
    assert.equal(post.title, "hello2");

    result = await posts.findOneAndDelete({ _id: p1.insertedId });
    assert.instanceOf(result.value, Post);

    await teardown();
  });

  it("Should work with count", async () => {
    const { container, teardown } = await createEcosystem();

    const posts = container.get(Posts);

    const postsCount = await posts.count();

    assert.equal(postsCount, 0);

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

    assert.equal(allPostsCountAfterInsert, postsToInsertCount);
    assert.equal(postsCountWithGivenTitle, 1);
    assert.equal(postsCountLimit5, 5);

    await teardown();
  });

  it("Should work with count when having softdeletable behavior (deleteOne, deleteMany)", async () => {
    const { container, teardown } = await createEcosystem();

    const comments = container.get(Comments);

    const _id = (await comments.insertOne({ title: "test" })).insertedId;
    await comments.deleteOne({ _id });

    const commentsCount = await comments.count();
    assert.equal(commentsCount, 0);

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

    assert.equal(await comments.count(), randomNumberOfComments);

    await comments.deleteMany({});

    assert.equal(await comments.count(), 0);

    await teardown();
  });
});
