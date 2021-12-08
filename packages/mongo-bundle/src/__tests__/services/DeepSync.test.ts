import { getEcosystem } from "../helpers";
import { Comments, Comment } from "./dummy/comments";
import { Posts, Post } from "./dummy/posts";
import { Users, User } from "./dummy/users";
import { DatabaseService } from "../../services/DatabaseService";
import { DeepPartial } from "@bluelibs/core";
import { Tag, Tags } from "./dummy/tags";

describe("DeepSync", () => {
  test("Should work with deepSync with plain objects", async () => {
    const { container } = await getEcosystem();

    const dbService = container.get(DatabaseService);
    const comments = container.get(Comments);
    const posts = container.get(Posts);
    const users = container.get(Users);

    const data: DeepPartial<User> = {
      name: "John Smith",
      posts: [
        {
          title: "Post 1",
          comments: [
            {
              title: "Hello 1",
            },
            {
              title: "Hello 2",
            },
          ],
        },
        {
          title: "Post 2",
        },
      ],
    };

    await users.deepSync(data);

    const userObjects = await users.find({}).toArray();
    expect(userObjects).toHaveLength(1);
    const user = userObjects[0];

    const postObjects = await posts.find({}).toArray();
    expect(postObjects).toHaveLength(2);

    const commentObjects = await comments.find({}).toArray();
    expect(commentObjects).toHaveLength(2);
    commentObjects.forEach((comment) => {
      expect(comment.postId).toBeTruthy();
    });
  });

  test("Should work with deepSync with objects", async () => {
    const { container } = await getEcosystem();

    const dbService = container.get(DatabaseService);
    const comments = container.get(Comments);
    const posts = container.get(Posts);
    const users = container.get(Users);

    const user = new User();
    user.name = "John Smith";

    const post1 = new Post();
    post1.title = "Post 1";
    const post2 = new Post();
    post2.title = "Post 2";

    const c1 = new Comment();
    c1.title = "Comment 1";
    c1.user = user;
    const c2 = new Comment();
    c2.title = "Comment 2";
    c2.user = user;

    user.posts.push(post1, post2);
    post1.comments.push(c1, c2);

    await users.deepSync(user);

    const commentObjects = await comments.find({}).toArray();
    expect(commentObjects).toHaveLength(2);
    commentObjects.forEach((comment) => {
      expect(comment.userId).toBeTruthy();
      expect(comment.userId.toString()).toBe(user._id.toString());
    });
  });

  test("Should work with deepSync and object references from different directions", async () => {
    const { container } = await getEcosystem();

    const dbService = container.get(DatabaseService);
    const comments = container.get(Comments);
    const posts = container.get(Posts);
    const users = container.get(Users);

    const user = new User();
    user.name = "John Smith";

    const post1 = new Post();
    post1.title = "Post 1";
    const post2 = new Post();
    post2.title = "Post 2";

    const c1 = new Comment();
    c1.title = "Comment 1";
    c1.user = user;
    const c2 = new Comment();
    c2.title = "Comment 2";
    c2.user = user;

    user.posts.push(post1, post2);
    post1.comments.push(c1, c2);

    await posts.deepSync([post1, post2]);

    const commentObjects = await comments.find({}).toArray();
    expect(commentObjects).toHaveLength(2);
    commentObjects.forEach((comment) => {
      expect(comment.userId).toBeTruthy();
      expect(comment.userId.toString()).toBe(user._id.toString());
    });
  });

  test("It should work linking data", async () => {
    const { container } = await getEcosystem();

    const dbService = container.get(DatabaseService);
    const comments = container.get(Comments);
    const posts = container.get(Posts);
    const users = container.get(Users);

    const data: DeepPartial<User> = {
      name: "John Smith",
      posts: [
        {
          title: "Post 1",
          comments: [
            {
              title: "Hello 1",
            },
            {
              title: "Hello 2",
            },
          ],
        },
        {
          title: "Post 2",
        },
      ],
    };

    await users.deepSync(data);
  });

  test("Link Operator", async () => {
    const { container } = await getEcosystem();

    const dbService = container.get(DatabaseService);
    const comments = container.get(Comments);
    const posts = container.get(Posts);
    const users = container.get(Users);
    const tags = container.get(Tags);

    const tag1 = new Tag({ title: "Tag 1" });
    const tag2 = new Tag({ title: "Tag 2" });
    const post = new Post({
      title: "Post 1",
      tags: [tag1, tag2],
    });

    await posts.deepSync(post);

    const operator = posts.getLinkOperator("tags");

    // Should create the tag.
    const newTag = new Tag({ title: "Tag 3" });

    await operator.link(post._id, newTag);
    expect(await tags.find().count()).toBe(3);

    await operator.unlink(post._id, newTag);
    const postResult = await posts.queryOne({
      tags: {
        title: 1,
      },
    });
    expect(postResult.tags).toHaveLength(2);
    expect(await tags.find().count()).toBe(3);

    expect(await tags.findOne({ _id: newTag._id })).toBeTruthy();

    await operator.unlink(post._id, newTag, {
      delete: true,
    });

    expect(await tags.find().count()).toBe(2);

    const postResult2 = await posts.queryOne({
      _id: 1,
      tagsIds: 1,
    });
    expect(postResult2.tagsIds).toHaveLength(2);

    await operator.clean(postResult2._id, {
      delete: true,
    });
    expect(await tags.find().count()).toBe(0);
    // await operator.clean(postId, { delete: true }); // removes tags and delets them
    // await operator.link(postId, [tagId1, tagId2], { override: true }); // overrides
    // await operator.unlink(postId, [tagId1, tagId2], { delete: true }); // (works with many relationships only) adds aditional tags
  });
});
