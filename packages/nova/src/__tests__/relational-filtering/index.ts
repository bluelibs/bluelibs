import { query, clear, lookup, addReducers } from "../../core/api";
import { getRandomCollection, idsEqual } from "../integration/helpers";
import { Collection } from "mongodb";
import {
  oneToMany,
  manyToMany,
  oneToOne,
  manyToOne,
} from "../../core/quickLinkers";
import { assert } from "chai";

describe("Relational Filtering", () => {
  let A: Collection;
  let B: Collection;
  let C: Collection;
  let D: Collection;
  let E: Collection;

  beforeAll(async () => {
    A = await getRandomCollection("A");
    B = await getRandomCollection("B");
    C = await getRandomCollection("C");
    D = await getRandomCollection("D");
    E = await getRandomCollection("E");
  });

  // Cleans the collection and their defined links
  afterEach(async () => {
    await A.deleteMany({});
    await B.deleteMany({});
    await C.deleteMany({});
    await D.deleteMany({});
    await E.deleteMany({});

    [A, B, C, D, E].forEach((coll) => clear(coll));
  });

  it("M:M:D - Simple filtering of nested collection", async () => {
    // A has many B.
    manyToMany(A, B, {
      linkName: "bs",
      inversedLinkName: "as",
    });

    const b1 = await B.insertOne({ name: "B1", number: 5 });
    const b2 = await B.insertOne({ name: "B2", number: 10 });
    const b3 = await B.insertOne({ name: "B3", number: 50 });

    const a1 = await A.insertOne({
      name: "A1",
      bsIds: [b1.insertedId, b2.insertedId],
    });

    const a2 = await A.insertOne({
      name: "A2",
      bsIds: [b2.insertedId, b3.insertedId],
    });

    const a3 = await A.insertOne({
      name: "A3",
      bsIds: [b1.insertedId],
    });

    // We are looking for A's which have exactly 2 B's
    const result = await query(A, {
      $: {
        pipeline: [
          lookup(A, "bs"),
          {
            $match: {
              bs: {
                $size: 2,
              },
            },
          },
        ],
      },
      _id: 1,
      bs: {
        _id: 1,
      },
    }).fetch();

    assert.lengthOf(result, 2);

    // Now I want to get all bs who have at least 2 A's
    const result2 = await query(B, {
      $: {
        pipeline: [
          lookup(B, "as"),
          {
            $match: {
              as: {
                $size: 2,
              },
            },
          },
        ],
      },
      _id: 1,
      as: {
        _id: 1,
      },
    }).fetch();

    assert.lengthOf(result2, 2);
  });

  it("1:1 - I want to search users who have at least X in their bank account", async () => {
    // A has many B.
    const Users = A;
    const BankAccounts = B;

    oneToOne(Users, BankAccounts, {
      linkName: "bankAccount",
      inversedLinkName: "user",
    });

    const b1 = await BankAccounts.insertOne({ name: "B1", amount: 500 });
    const b2 = await BankAccounts.insertOne({ name: "B1", amount: 5 });

    const u1 = await Users.insertOne({
      name: "B1",
      number: 5,
      bankAccountId: b1.insertedId,
    });
    const u2 = await Users.insertOne({
      name: "B1",
      number: 5,
      bankAccountId: b2.insertedId,
    });

    // We are looking for A's which have exactly 2 B's
    const result = await query(Users, {
      $: {
        pipeline: [
          lookup(Users, "bankAccount"),
          {
            $match: {
              "bankAccount.amount": {
                $gte: 500,
              },
            },
          },
        ],
      },
      _id: 1,
      bs: {
        _id: 1,
      },
      bsCount: 1,
    }).fetch();

    assert.lengthOf(result, 1);
    assert.equal(u1.insertedId.toString(), result[0]._id.toString());
  });

  it("Reducers can extend the pipeline and allow fields", async () => {
    // A has many B.
    const Comments = A;
    const Posts = B;

    manyToOne(Comments, Posts, {
      linkName: "post",
      inversedLinkName: "comments",
    });

    addReducers(Posts, {
      commentsCount: {
        dependency: { _id: 1 },
        pipeline: [
          lookup(Posts, "comments"),
          {
            $addFields: {
              commentsCount: { $size: "$comments" },
            },
          },
        ],
      },
    });

    const p1 = await Posts.insertOne({ name: "John Post" });

    const comments = await Comments.insertMany([
      { title: "1", postId: p1.insertedId },
      { title: "1", postId: p1.insertedId },
      { title: "1", postId: p1.insertedId },
      { title: "1", postId: p1.insertedId },
      { title: "1", postId: p1.insertedId },
    ]);

    const result = await query(Posts, {
      commentsCount: 1,
    }).fetchOne();

    assert.isObject(result);
    assert.equal(result.commentsCount, 5);
  });

  it("We should be able to sort by link value", async () => {
    // A has many B.
    const Users = A;
    const BankAccounts = B;

    oneToOne(Users, BankAccounts, {
      linkName: "bankAccount",
      inversedLinkName: "user",
    });

    const b1 = await BankAccounts.insertOne({ amount: 500 });
    const b2 = await BankAccounts.insertOne({ amount: 5 });
    const b3 = await BankAccounts.insertOne({ amount: 600 });
    const b4 = await BankAccounts.insertOne({ amount: 0 });

    const u1 = await Users.insertOne({ bankAccountId: b1.insertedId });
    const u2 = await Users.insertOne({ bankAccountId: b2.insertedId });
    const u3 = await Users.insertOne({ bankAccountId: b3.insertedId });
    const u4 = await Users.insertOne({ bankAccountId: b4.insertedId });

    // We are looking for A's which have exactly 2 B's
    const result = await query(Users, {
      $: {
        pipeline: [
          lookup(Users, "bankAccount"),
          {
            $sort: {
              "bankAccount.amount": 1,
            },
          },
        ],
      },
      _id: 1,
    }).fetch();

    // Order should be: u4, u2, u1, u3
    assert.isTrue(idsEqual(result[0]._id, u4.insertedId));
    assert.isTrue(idsEqual(result[1]._id, u2.insertedId));
    assert.isTrue(idsEqual(result[2]._id, u1.insertedId));
    assert.isTrue(idsEqual(result[3]._id, u3.insertedId));
  });

  it("We should be able to filter by deeper links", async () => {
    // Deeper checks, for example, only users belonging to companies with minimum 5 departments
    const Users = A;
    const Companies = B;
    const Departments = C;

    manyToOne(Users, Companies, {
      linkName: "company",
      inversedLinkName: "users",
    });

    manyToMany(Companies, Departments, {
      linkName: "departments",
      inversedLinkName: "companies",
    });

    const d1 = await Departments.insertOne({});
    const d2 = await Departments.insertOne({});
    const d3 = await Departments.insertOne({});
    const d4 = await Departments.insertOne({});

    const c1 = await Companies.insertOne({
      departmentsIds: [d1.insertedId, d2.insertedId],
    });
    const c2 = await Companies.insertOne({
      departmentsIds: [d1.insertedId, d3.insertedId, d4.insertedId],
    });
    const c3 = await Companies.insertOne({
      departmentsIds: [d1.insertedId],
    });
    const c4 = await Companies.insertOne({
      departmentsIds: null,
    });

    await Users.insertMany([
      { companyId: c1.insertedId },
      { companyId: c2.insertedId },
      { companyId: c3.insertedId },
      { companyId: c4.insertedId },
      { companyId: c2.insertedId },
      { companyId: c3.insertedId },
      { companyId: c4.insertedId },
      { companyId: c1.insertedId },
      { companyId: c2.insertedId },
      { companyId: c3.insertedId },
      { companyId: c4.insertedId },
      { companyId: c1.insertedId },
    ]);

    // We are looking for A's which have exactly 2 B's
    const result = await query(Users, {
      $: {
        pipeline: [
          lookup(Users, "company", {
            pipeline: [
              lookup(Companies, "departments"),
              {
                $addFields: {
                  departmentsCount: { $size: "$departments" },
                },
              },
            ],
          }),
          {
            $match: {
              "company.departmentsCount": {
                $gte: 2,
              },
            },
          },
        ],
      },
      _id: 1,
      companyId: 1,
    }).fetch();

    assert.lengthOf(result, 6);
    result.forEach((user) => {
      assert.isTrue(
        idsEqual(user.companyId, c1.insertedId) ||
          idsEqual(user.companyId, c2.insertedId)
      );
    });
  });

  // I want to fetch all users belonging to companies where they, themselves are director
  it("Should be able to work with dynamic filterings", async () => {
    const Users = A;
    const Companies = B;

    manyToOne(Users, Companies, {
      linkName: "company",
      inversedLinkName: "users",
    });

    oneToOne(Companies, Users, {
      linkName: "director",
    });

    const c1 = await Companies.insertOne({ name: "ACME" });
    const c2 = await Companies.insertOne({ name: "JOHNSON" });
    const c3 = await Companies.insertOne({ name: "WAFFLE" });

    const u1 = await Users.insertOne({
      index: 1,
      name: "D",
      companyId: c1.insertedId,
    });
    const u2 = await Users.insertOne({
      index: 2,
      name: "U",
      companyId: c2.insertedId,
    });
    const u3 = await Users.insertOne({
      index: 3,
      name: "D",
      companyId: c2.insertedId,
    });
    const u4 = await Users.insertOne({
      index: 4,
      name: "U",
      companyId: c1.insertedId,
    });

    Companies.updateOne(
      { _id: c1.insertedId },
      {
        $set: {
          directorId: u1.insertedId,
        },
      }
    );
    Companies.updateOne(
      { _id: c2.insertedId },
      {
        $set: {
          directorId: u3.insertedId,
        },
      }
    );

    const result = await query(Users, {
      $: {
        options: {
          sort: {
            index: 1,
          },
        },
      },
      _id: 1,
      company: {
        $(parent) {
          return {
            filters: {
              directorId: parent._id,
            },
          };
        },
      },
    }).fetch();

    assert.lengthOf(result, 4);
    result.forEach((user) => {
      const isDirector =
        idsEqual(user._id, u1.insertedId) || idsEqual(user._id, u3.insertedId);

      if (isDirector) {
        assert.isObject(user.company);
      } else {
        assert.isNull(user.company);
      }
    });
  });

  // Test the $alias thingie
  it("Should allow aliasing collections", async () => {
    // A has many B.
    const Comments = A;
    const Posts = B;

    manyToOne(Comments, Posts, {
      linkName: "post",
      inversedLinkName: "comments",
    });

    const p1 = await Posts.insertOne({ name: "John Post" });

    const comments = await Comments.insertMany([
      { title: "1", postId: p1.insertedId },
      { title: "2", postId: p1.insertedId },
      { title: "3", postId: p1.insertedId },
      { title: "4", postId: p1.insertedId },
      { title: "5", postId: p1.insertedId },
    ]);

    const post = await query(Posts, {
      newestComments: {
        $alias: "comments",
        $: {
          options: {
            limit: 3,
          },
        },
        title: 1,
      },
      otherComments: {
        $alias: "comments",
        $: {
          options: { limit: 2 },
        },
        title: 1,
      },
    }).fetchOne();

    assert.isObject(post);
    assert.lengthOf(post.newestComments, 3);
    assert.lengthOf(post.otherComments, 2);
    post.newestComments.forEach((comment) => {
      assert.isString(comment.title);
    });
    post.otherComments.forEach((comment) => {
      assert.isString(comment.title);
    });
  });

  // Check pipeline on children collection links via hypernova
  it("Pipeline for children should work", async () => {
    // A has many B.
    const Comments = A;
    const Posts = B;
    const Authors = C;

    manyToOne(Comments, Posts, {
      linkName: "post",
      inversedLinkName: "comments",
    });

    manyToOne(Comments, Authors, {
      linkName: "author",
      inversedLinkName: "comments",
    });

    const a1 = await Authors.insertOne({ eligible: true });
    const a2 = await Authors.insertOne({});
    const a3 = await Authors.insertOne({});

    const p1 = await Posts.insertOne({ name: "John Post" });

    const comments = await Comments.insertMany([
      { title: "1", postId: p1.insertedId, authorId: a1.insertedId },
      { title: "2", postId: p1.insertedId, authorId: a2.insertedId },
      { title: "3", postId: p1.insertedId, authorId: a3.insertedId },
      { title: "4", postId: p1.insertedId, authorId: a1.insertedId },
      { title: "5", postId: p1.insertedId, authorId: a3.insertedId },
    ]);

    const post = await query(Posts, {
      comments: {
        $: {
          pipeline: [
            lookup(Comments, "author"),
            {
              $match: {
                "author.eligible": true,
              },
            },
          ],
        },
        authorId: 1,
      },
    }).fetchOne();

    assert.isObject(post);
    assert.lengthOf(post.comments, 2);
    post.comments.forEach((comment) => {
      assert.isTrue(idsEqual(comment.authorId, a1.insertedId));
    });
  });
});
