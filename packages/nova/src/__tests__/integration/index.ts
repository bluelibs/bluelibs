import { assert, expect } from "chai";
import * as _ from "lodash";
import { getRandomCollection, log } from "./helpers";
import {
  addLinks,
  query,
  clear,
  addExpanders,
  addReducers,
} from "../../core/api";
import { client } from "../connection";
import { Collection } from "mongodb";
import {
  manyToMany,
  manyToOne,
  oneToOne,
  oneToMany,
} from "../../core/quickLinkers";

// Read: https://mongodb.github.io/node-mongodb-native/3.3/api/
declare module "../../core/defs" {
  export interface IQueryContext {
    test?: any;
  }
}

beforeAll(async () => {
  await client.connect();
  await client.db("test").dropDatabase();
});

afterAll(async () => {
  await client.close();
});

describe("Main tests", function () {
  let A: Collection;
  let B: Collection;
  let C: Collection;
  let D: Collection;
  let E: Collection;
  let GeoPoint: Collection;

  beforeAll(async () => {
    A = await getRandomCollection("A");
    B = await getRandomCollection("B");
    C = await getRandomCollection("C");
    D = await getRandomCollection("D");
    E = await getRandomCollection("E");
    GeoPoint = await getRandomCollection("GeoPoint");
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

  it("[Many - Direct] Should work with many and many-inversed", async () => {
    manyToMany(A, B, {
      linkName: "bs",
    });

    const b1 = await B.insertOne({ number: 200 });
    const b2 = await B.insertOne({ number: 300 });
    const b3 = await B.insertOne({ number: 500 });
    await A.insertOne({
      number: 100,
      bsIds: [b1, b2, b3].map((b) => b.insertedId),
    });

    let result = await query(A, {
      bs: {
        number: 1,
      },
    }).fetchOne();

    assert.isUndefined(result.bIds);
    assert.isArray(result.bs);
    assert.lengthOf(result.bs, 3);
    result.bs.forEach((b) => {
      assert.isNumber(b.number);
    });
  });

  it("[Many - Inversed] Simple Query", async () => {
    manyToMany(A, B, {
      linkName: "bs",
      inversedLinkName: "as",
    });

    const b1 = await B.insertOne({ number: 200 });
    const b2 = await B.insertOne({ number: 300 });
    const b3 = await B.insertOne({ number: 500 });

    await A.insertOne({
      number: 100,
      bsIds: [b1, b2, b3].map((b) => b.insertedId),
    });

    let result = await query(A, {
      bs: {
        number: 1,
      },
    }).fetchOne();

    assert.isUndefined(result.bIds);
    assert.isArray(result.bs);
    assert.lengthOf(result.bs, 3);
    result.bs.forEach((b) => {
      assert.isNumber(b.number);
    });

    result = await query(B, {
      as: {
        number: 1,
      },
    }).fetchOne();

    assert.isArray(result.as);
    assert.lengthOf(result.as, 1);
    result.as.forEach((a) => {
      assert.isNumber(a.number);
    });
  });

  it("[One - Direct] Simple Query", async () => {
    manyToOne(A, B, {
      linkName: "b",
      inversedLinkName: "a",
    });

    const b = await B.insertOne({
      name: "John",
    });

    const a = await A.insertOne({
      bId: b.insertedId,
      number: 200,
    });

    let result: any = await query(A, {
      b: {
        name: 1,
      },
      _id: 1,
    }).fetchOne();

    assert.isUndefined(result.bId);
    assert.isObject(result.b);
    assert.isUndefined(result.name);
    assert.isObject(result._id);
    assert.isString(result.b.name);
  });

  it("[One - Inversed] Simple Query", async () => {
    manyToOne(A, B, {
      linkName: "b",
      inversedLinkName: "a",
    });

    const b = await B.insertOne({
      name: "John",
    });

    const a = await A.insertOne({
      bId: b.insertedId,
      number: 200,
    });

    const result = await query(B, {
      a: {
        number: 1,
      },
    }).fetchOne();

    assert.isObject(result);
    assert.isArray(result.a);
    assert.isNumber(result.a[0].number);
    assert.isUndefined(result.a[0].bId);
  });

  it("[OneToMAny - Inversed] uniqueness and one result", async () => {
    oneToMany(A, B, {
      inversedLinkName: "a",
      linkName: "bs",
    });

    const b = await B.insertOne({
      name: "John",
    });

    const a = await A.insertOne({
      bsIds: [b.insertedId],
      number: 200,
    });

    const result = await query(B, {
      a: {
        number: 1,
      },
    }).fetchOne();

    assert.isObject(result);
    assert.isObject(result.a);
    assert.isNumber(result.a.number);
    assert.isUndefined(result.a.bId);
  });

  it("[One - Inversed] uniqueness and one result", async () => {
    oneToOne(A, B, {
      linkName: "b",
      inversedLinkName: "a",
    });

    const b = await B.insertOne({
      name: "John",
    });

    const a = await A.insertOne({
      bId: b.insertedId,
      number: 200,
    });

    const result = await query(B, {
      a: {
        number: 1,
      },
    }).fetchOne();

    assert.isObject(result);
    assert.isObject(result.a);
    assert.isNumber(result.a.number);
    assert.isUndefined(result.a.bId);
  });

  it("[One - Direct] Should work with fields as objects", async () => {
    manyToOne(A, B, {
      linkName: "b",
      inversedLinkName: "a",
    });

    const b = await B.insertOne({
      name: "John",
    });

    const a = await A.insertOne({
      bId: b.insertedId,
      number: 200,
    });

    let result: any = await query(A, {
      b: {
        name: {},
      },
      bId: {},
      _id: {},
    }).fetchOne();

    assert.isDefined(result.bId);
    assert.isDefined(result._id);
    assert.isDefined(result.b.name);
  });

  it("[Direct] Should work with filters and custom options", async () => {
    manyToMany(A, B, {
      linkName: "bs",
      inversedLinkName: "as",
    });

    const b1 = await B.insertOne({ number: 200 });
    const b2 = await B.insertOne({ number: 300 });
    const b3 = await B.insertOne({ number: 500 });

    await A.insertOne({
      number: 100,
      bsIds: [b1, b2, b3].map((b) => b.insertedId),
    });
    await A.insertOne({
      number: 200,
      bsIds: [b1, b2, b3].map((b) => b.insertedId),
    });
    await A.insertOne({ number: 300, bsIds: [b3].map((b) => b.insertedId) });

    let result: any = await query(A, {
      $: {
        filters: {
          number: 100,
        },
      },
      bs: {
        $: {
          filters: {
            number: { $gte: 300 },
          },
        },
        number: 1,
      },
    }).fetch();

    assert.lengthOf(result, 1);
    result = result[0];

    assert.isUndefined(result.bsIds);
    assert.isArray(result.bs);

    assert.lengthOf(result.bs, 2);
    result.bs.forEach((b) => {
      assert.isTrue(b.number >= 300);
      assert.isNumber(b.number);
    });
  });

  it("[Virtual] Should work with filters and custom options", async () => {
    manyToMany(A, B, {
      linkName: "bs",
      inversedLinkName: "as",
    });

    const b1 = await B.insertOne({ number: 200 });
    const b2 = await B.insertOne({ number: 300 });
    const b3 = await B.insertOne({ number: 500 });

    await A.insertOne({
      bsIds: [b1, b2, b3].map((b) => b.insertedId),
      number: 100,
    });
    await A.insertOne({
      bsIds: [b1, b2, b3].map((b) => b.insertedId),
      number: 200,
    });
    await A.insertOne({ number: 300, bsIds: [b3].map((b) => b.insertedId) });

    const result = await query(B, {
      $: {
        filters: {
          number: { $gte: 300 }, // only matching b2,b3
        },
        options: {
          sort: {
            number: -1,
          },
        },
      },
      _id: 1,
      as: {
        $: {
          filters: {
            number: { $gte: 200 },
          },
        },
        number: 1,
      },
    }).fetch();

    assert.lengthOf(result, 2);
    assert.isTrue(result[0]._id.equals(b3.insertedId));
    assert.isTrue(result[1]._id.equals(b2.insertedId));

    result.forEach((b) => {
      assert.isArray(b.as);
    });

    assert.lengthOf(result[0].as, 2);
    assert.lengthOf(result[1].as, 1);
  });

  it("Should work with expanding the field from an object, one-level", async () => {
    manyToOne(A, B, {
      linkName: "b",
      inversedLinkName: "as",
    });

    const b1 = await B.insertOne({
      profile: { firstName: "john", lastName: "smith", number: "07xxxxxxxxxx" },
    });

    let bResult = await query(B, {
      profile: {
        firstName: 1,
        number: 1,
      },
    }).fetchOne();

    assert.isObject(bResult.profile);
    assert.isString(bResult.profile.firstName);
    assert.isUndefined(bResult.profile.lastName);
    assert.isString(bResult.profile.number);

    const a1 = await A.insertOne({
      bId: b1.insertedId,
    });

    const result = await query(A, {
      b: {
        profile: {
          firstName: 1,
        },
      },
    }).fetchOne();

    bResult = result.b;
    assert.isObject(bResult.profile);
    assert.isString(bResult.profile.firstName);
    assert.isUndefined(bResult.profile.lastName);
    assert.isUndefined(bResult.profile.number);
  });

  // multi elements and filters
  it("should work when we have many to many and filter in query", async () => {
    manyToMany(A, B, {
      linkName: "bs",
      inversedLinkName: "as",
    });

    const a1 = await A.insertOne({ n: 1 });
    const a2 = await A.insertOne({ n: 2 });
    const a3 = await A.insertOne({ n: 3 });

    const b1 = await B.insertOne({ n: 1 });
    const b2 = await B.insertOne({ n: 2 });
    const b3 = await B.insertOne({ n: 3 });

    await A.updateOne(
      {
        _id: a1.insertedId,
      },
      {
        $set: {
          bsIds: [b2.insertedId, b3.insertedId],
        },
      }
    );
    await A.updateOne(
      {
        _id: a2.insertedId,
      },
      {
        $set: {
          bsIds: [b1.insertedId, b3.insertedId],
        },
      }
    );

    const result = await query(A, {
      $: {
        options: { sort: { n: 1 } },
      },
      n: 1,
      bs: {
        n: 1,
      },
    }).fetch();

    assert.lengthOf(result, 3);
    assert.lengthOf(result[0].bs, 2);
    assert.lengthOf(result[1].bs, 2);
    assert.lengthOf(result[2].bs, 0);
  });

  it("[Expanders] Should work with simple field level expansion", async () => {
    addExpanders(A, {
      fullName: {
        profile: {
          firstName: 1,
          lastName: 1,
        },
      },
    });

    const a1 = await A.insertOne({
      profile: {
        firstName: 1,
        lastName: 1,
        number: 1,
      },
    });

    const result: any = await query(A, {
      _id: 1,
      fullName: 1,
    }).fetchOne();

    assert.isUndefined(result.fullName);
    assert.isObject(result.profile);
    assert.isDefined(result.profile.firstName);
    assert.isDefined(result.profile.lastName);
    assert.isUndefined(result.profile.number);
  });

  it("[Expanders] Should expand and merge into already defined fields", async () => {
    addExpanders(A, {
      fullName: {
        profile: {
          firstName: 1,
          lastName: 1,
        },
      },
    });

    const a1 = await A.insertOne({
      profile: {
        firstName: 1,
        lastName: 1,
        number: 1,
      },
    });

    const result: any = await query(A, {
      _id: 1,
      profile: {
        firstName: 1,
      },
      fullName: 1,
    }).fetchOne();

    assert.isUndefined(result.fullName);
    assert.isObject(result.profile);
    assert.isDefined(result.profile.firstName);
    assert.isDefined(result.profile.lastName);
    assert.isUndefined(result.profile.number);
  });

  it("[Expanders] Should expand and merge into linked elements", async () => {
    manyToOne(A, B, {
      linkName: "b",
      inversedLinkName: "as",
    });

    addExpanders(A, {
      fullName: {
        b: {
          profile: {
            firstName: 1,
          },
        },
      },
    });

    const b1 = await B.insertOne({
      profile: {
        firstName: 1,
        lastName: 1,
        number: 1,
      },
    });

    const a1 = await A.insertOne({
      profile: {
        firstName: 1,
        lastName: 1,
        number: 1,
      },
      bId: b1.insertedId,
    });

    const result: any = await query(A, {
      _id: 1,
      fullName: 1,
    }).fetchOne();

    assert.isUndefined(result.fullName);
    assert.isObject(result.b);
    assert.isDefined(result.b.profile.firstName);
    assert.isUndefined(result.b.profile.number);
  });

  it("[Expanders] Should contain the element if it was self-specified", async () => {
    manyToOne(A, B, {
      linkName: "b",
      inversedLinkName: "as",
    });

    addExpanders(A, {
      firstName: {
        firstName: 1,
        lastName: 1,
      },
    });

    const b1 = await A.insertOne({
      firstName: "John",
      lastName: "Smith",
    });

    const result: any = await query(A, {
      _id: 1,
      firstName: 1,
    }).fetchOne();

    assert.isDefined(result.firstName);
    assert.isDefined(result.lastName);
  });

  it("[Expanders] Should contain the element if it was self-specified and is nested", async () => {
    addExpanders(A, {
      thumbs: {
        thumbs: {
          id: 1,
        },
      },
    });

    const b1 = await A.insertOne({
      thumbs: [{ id: "123", type: "123" }, { id: "100" }],
    });

    const result: any = await query(A, {
      _id: 1,
      thumbs: {
        type: 1,
      },
    }).fetchOne();

    assert.isDefined(result.thumbs);
    assert.isDefined(result.thumbs[0].id);
    assert.isDefined(result.thumbs[0].id);
  });

  it("[Reducers] Should work with simple field level expansion", async () => {
    addReducers(A, {
      fullName: {
        dependency: {
          profile: {
            firstName: 1,
            lastName: 1,
          },
        },
        async reduce(obj, params) {
          return `${obj.profile.firstName} ${obj.profile.lastName}`;
        },
      },
    });

    const a1 = await A.insertOne({
      profile: {
        firstName: 1,
        lastName: 1,
        number: 1,
      },
    });

    const result: any = await query(A, {
      _id: 1,
      fullName: 1,
    }).fetchOne();

    assert.equal(`1 1`, result.fullName);
    assert.isUndefined(result.profile);
  });

  it("[Reducers] Should work with reducers that have the same name", async () => {
    addReducers(A, {
      name: {
        dependency: {
          name: 1,
        },
        async reduce(obj, params) {
          return `${obj.name} world!`;
        },
      },
    });

    const a1 = await A.insertOne({
      name: "Hello",
    });

    const result: any = await query(A, {
      _id: 1,
      name: 1,
    }).fetchOne();

    assert.equal(`Hello world!`, result.name);
  });

  it("[Reducers] Should work with context", async () => {
    addReducers(A, {
      fullName: {
        dependency: {
          profile: {
            firstName: 1,
            lastName: 1,
          },
        },
        async reduce(obj, { context }) {
          // @ts-ignore
          assert.equal(context.test, 1);
          return `${obj.profile.firstName} ${obj.profile.lastName}`;
        },
      },
    });

    const a1 = await A.insertOne({
      profile: {
        firstName: 1,
        lastName: 1,
        number: 1,
      },
    });

    const result: any = await query(
      A,
      {
        _id: 1,
        fullName: 1,
      },
      {
        test: 1,
      }
    ).fetchOne();

    assert.equal(`1 1`, result.fullName);
    assert.isUndefined(result.profile);
  });

  it("[Reducers] Should work with context passed as $context", async () => {
    addReducers(A, {
      fullName: {
        dependency: {
          profile: {
            firstName: 1,
            lastName: 1,
          },
        },
        async reduce(obj, { context }) {
          // @ts-ignore
          assert.equal(context.test, 1);
          return `${obj.profile.firstName} ${obj.profile.lastName}`;
        },
      },
    });

    const a1 = await A.insertOne({
      profile: {
        firstName: 1,
        lastName: 1,
        number: 1,
      },
    });

    const result: any = await query(A, {
      $context: {
        test: 1,
      },
      _id: 1,
      fullName: 1,
    }).fetchOne();

    assert.equal(`1 1`, result.fullName);
    assert.isUndefined(result.profile);
  });

  it("[Reducers] Should work with nested expansion", async () => {
    manyToOne(A, B, {
      linkName: "b",
      inversedLinkName: "as",
    });

    addReducers(A, {
      fullName: {
        dependency: {
          b: {
            profile: {
              firstName: 1,
              lastName: 1,
            },
          },
        },
        async reduce(obj, params) {
          return `${obj.b.profile.firstName} ${obj.b.profile.lastName}`;
        },
      },
    });

    const b1 = await B.insertOne({
      profile: {
        firstName: "a",
        lastName: "b",
        number: 500,
      },
    });
    const a1 = await A.insertOne({
      bId: b1.insertedId,
    });

    const result: any = await query(A, {
      _id: 1,
      fullName: 1,
    }).fetchOne();

    assert.equal(`a b`, result.fullName);
    assert.isUndefined(result.b);
  });

  it("[Reducers] Should work with nested expansion and keep what I request", async () => {
    manyToOne(A, B, {
      linkName: "b",
      inversedLinkName: "as",
    });

    addReducers(A, {
      fullName: {
        dependency: {
          b: {
            profile: {
              firstName: 1,
              lastName: 1,
            },
          },
        },
        reduce(obj, params) {
          return `${obj.b.profile.firstName} ${obj.b.profile.lastName}`;
        },
      },
    });

    const b1 = await B.insertOne({
      profile: {
        firstName: "a",
        lastName: "b",
        number: 500,
      },
    });
    const a1 = await A.insertOne({
      bId: b1.insertedId,
    });

    const result: any = await query(A, {
      _id: 1,
      b: {
        profile: {
          number: 1,
        },
      },
      fullName: 1,
    }).fetchOne();

    assert.equal(`a b`, result.fullName);
    assert.isObject(result.b);
    assert.isObject(result.b.profile);
    assert.isNumber(result.b.profile.number);
    assert.lengthOf(Object.keys(result.b.profile), 1);
  });

  it("[Reducers] Should work with nested expansion and keep what I request #2", async () => {
    addReducers(A, {
      fullName: {
        dependency: {
          profile: {
            firstName: 1,
            lastName: 1,
          },
        },
        reduce(obj, params) {
          return `${obj.profile.firstName} ${obj.profile.lastName}`;
        },
      },
    });

    const a1 = await A.insertOne({
      profile: {
        firstName: "a",
        lastName: "b",
        number: 500,
      },
    });

    const result: any = await query(A, {
      _id: 1,
      profile: {
        firstName: 1,
        lastName: 1,
      },
      fullName: 1,
    }).fetchOne();

    assert.equal(`a b`, result.fullName);
    assert.isObject(result.profile);
    assert.isString(result.profile.firstName);
    assert.isString(result.profile.lastName);
  });

  it("[Reducers] Should work well within many reducers", async () => {
    const Deals = await getRandomCollection("Deals");

    addReducers(Deals, {
      notesLength: {
        dependency: {
          notes: true,
        },
        async reduce(deal) {
          return deal.notes?.length;
        },
      },
      hasNotes: {
        dependency: {
          notesLength: true,
        },
        async reduce(deal) {
          return deal.notesLength > 0;
        },
      },
      sureItHasNotes: {
        dependency: {
          hasNotes: true,
        },
        async reduce(deal) {
          return deal.hasNotes === true; // Edited
        },
      },
    });

    const deal1 = await Deals.insertOne({
      name: "Deal 1",
      notes: ["note 1", "note 2"],
    });
    const tasks = await query(Deals, {
      _id: 1,
      name: 1,
      sureItHasNotes: 1,
    }).fetch();

    const deal1Result = tasks[0];
    assert.isTrue(deal1Result.sureItHasNotes);
    assert.isUndefined(deal1Result.notesLength);
    assert.isUndefined(deal1Result.hasNotes);
  });

  it("[Reducers] Should work with other reducers, same level", async () => {
    addReducers(A, {
      fullName: {
        dependency: {
          inversedName: 1,
        },
        reduce(obj, params) {
          return `prefix ${obj.inversedName}`;
        },
      },
      inversedName: {
        dependency: {
          profile: {
            firstName: 1,
          },
        },
        reduce(obj) {
          return `inversed ${obj.profile.firstName}`;
        },
      },
    });

    const a1 = await A.insertOne({
      profile: {
        firstName: "Aloha",
        lastName: "b",
        number: 500,
      },
    });

    const result: any = await query(A, {
      _id: 1,
      fullName: 1,
    }).fetchOne();

    assert.equal(`prefix inversed Aloha`, result.fullName);
    assert.isUndefined(result.inversedName);
  });

  it("[Reducers] Should not clean dependency reducer if specified in body", async () => {
    addReducers(A, {
      fullName: {
        dependency: {
          inversedName: 1,
        },
        reduce(obj, params) {
          return `prefix ${obj.inversedName}`;
        },
      },
      inversedName: {
        dependency: {
          profile: {
            firstName: 1,
          },
        },
        reduce(obj) {
          return `inversed ${obj.profile.firstName}`;
        },
      },
    });

    const a1 = await A.insertOne({
      profile: {
        firstName: "Aloha",
        lastName: "b",
        number: 500,
      },
    });

    const result: any = await query(A, {
      _id: 1,
      fullName: 1,
      inversedName: 1,
    }).fetchOne();

    assert.equal(`prefix inversed Aloha`, result.fullName);
    assert.isString(result.inversedName);
  });

  it("[Reducers] Should work with reducer parameters", async () => {
    addReducers(A, {
      fullName: {
        dependency: {
          profile: {
            firstName: 1,
          },
        },
        reduce(obj, params) {
          return `${obj.profile.firstName} ${params.lastName}`;
        },
      },
    });

    const a1 = await A.insertOne({
      profile: {
        firstName: "John",
        lastName: "b",
        number: 500,
      },
    });

    const result: any = await query(A, {
      _id: 1,
      fullName: {
        $: {
          lastName: "Smith",
        },
      },
    }).fetchOne();

    assert.equal(`John Smith`, result.fullName);
  });

  it("[Reducers] Should not clash with fields and other reducers", async () => {
    addReducers(A, {
      fullName: {
        dependency: {
          profile: {
            firstName: 1,
            lastName: 1,
          },
        },
        reduce(obj, params) {
          return `${obj.profile.firstName} ${obj.profile.lastName}`;
        },
      },
    });

    const a1 = await A.insertOne({
      profile: {
        firstName: "John",
        lastName: "Smith",
        number: 500,
      },
    });

    const result: any = await query(A, {
      _id: 1,
      profile: 1,
      fullName: 1,
    }).fetchOne();

    assert.equal(`John Smith`, result.fullName);
    assert.isObject(result.profile);
    assert.isString(result.profile.firstName);
    assert.isNumber(result.profile.number);
  });

  it("[Projection Fields] Should work with projection $filter", async () => {
    await A.insertOne({
      patients: [
        { name: "Konga", bloodPressure: 20 },
        { name: "Klara", bloodPressure: 50 },
        { name: "Kevara", bloodPressure: 50 },
      ],
    });

    const result: any = await query(A, {
      _id: 1,
      patients: {
        $filter: {
          input: "$patients",
          as: "patient",
          cond: { $gte: ["$$patient.bloodPressure", 50] },
        },
      },
    }).fetchOne();

    assert.isArray(result.patients);
    assert.lengthOf(result.patients, 2);
    result.patients.forEach((patient) => {
      assert.isTrue(patient.bloodPressure >= 50);
    });
  });

  it("[Nested Fields - One] Should work with nested fields direct and inversed", async () => {
    oneToOne(A, B, {
      field: "nested.linkId",
      inversedLinkName: "a",
      linkName: "b",
    });

    const b1 = await B.insertOne({
      test: "123",
    });

    await A.insertOne({
      nested: {
        linkId: b1.insertedId,
      },
      number: 123,
    });

    const result: any = await query(A, {
      _id: 1,
      b: {
        test: 1,
      },
    }).fetchOne();

    assert.isObject(result.b);
    assert.equal("123", result.b.test);

    const result2: any = await query(B, {
      a: {
        number: {},
      },
    }).fetchOne();

    assert.isObject(result2.a);
    assert.equal(123, result2.a.number);
  });

  it("[Nested Fields - Many] Should work with nested fields direct and inversed", async () => {
    manyToMany(A, B, {
      field: "nested.linkIds",
      inversedLinkName: "as",
      linkName: "bs",
    });

    const b1 = await B.insertOne({
      test: "123",
    });
    const b2 = await B.insertOne({
      test: "123",
    });

    await A.insertOne({
      nested: {
        linkIds: [b1.insertedId, b2.insertedId],
      },
      number: 123,
    });

    const result: any = await query(A, {
      _id: 1,
      bs: {
        test: 1,
      },
    }).fetchOne();

    assert.isArray(result.bs);
    assert.lengthOf(result.bs, 2);

    const result2: any = await query(B, {
      as: {
        number: {},
      },
    }).fetch();

    result2.forEach((r) => {
      assert.isArray(r.as);
      assert.lengthOf(r.as, 1);
    });
  });

  it("[Foreign Fields - One] Should work with foreign fields direct and inversed", async () => {
    oneToOne(A, B, {
      foreignField: "foreign",
      inversedLinkName: "a",
      linkName: "b",
    });

    const b1 = await B.insertOne({
      foreign: "someId",
      test: "123",
    });

    await A.insertOne({
      bId: "someId",
      number: 123,
    });

    const result: any = await query(A, {
      _id: 1,
      b: {
        test: 1,
      },
    }).fetchOne();

    assert.isObject(result.b);
    assert.equal("123", result.b.test);

    const result2: any = await query(B, {
      a: {
        number: {},
      },
    }).fetchOne();

    assert.isObject(result2.a);
    assert.equal(123, result2.a.number);
  });

  it("[Foreign Fields - Many] Should work with foreign fields direct and inversed", async () => {
    manyToMany(A, B, {
      foreignField: "foreign",
      inversedLinkName: "as",
      linkName: "bs",
    });

    const b1 = await B.insertOne({
      foreign: "someId1",
      test: "123",
    });
    const b2 = await B.insertOne({
      foreign: "someId2",
      test: "123",
    });

    await A.insertOne({
      bsIds: ["someId1", "someId2"],
      number: 123,
    });

    const result: any = await query(A, {
      _id: 1,
      bs: {
        test: 1,
      },
    }).fetchOne();

    assert.isArray(result.bs);
    assert.lengthOf(result.bs, 2);

    const result2: any = await query(B, {
      as: {
        number: {},
      },
    }).fetch();

    result2.forEach((r) => {
      assert.isArray(r.as);
      assert.lengthOf(r.as, 1);
    });
  });

  it("[Nested foreign Fields - One] Should work with foreign fields direct and inversed", async () => {
    oneToOne(A, B, {
      foreignField: "foreign.key",
      inversedLinkName: "a",
      linkName: "b",
    });

    const b1 = await B.insertOne({
      foreign: {
        key: "someId",
      },
      test: "123",
    });
    const b2 = await B.insertOne({
      foreign: {
        key: "someId2",
      },
      test: "shouldnotberetrieved",
    });

    await A.insertOne({
      bId: "someId",
      number: 123,
    });

    const result: any = await query(A, {
      _id: 1,
      b: {
        test: 1,
      },
    }).fetchOne();

    assert.isObject(result.b);
    assert.equal("123", result.b.test);

    const result2: any = await query(B, {
      a: {
        number: {},
      },
    }).fetchOne();

    assert.isObject(result2.a);
    assert.equal(123, result2.a.number);
  });

  it("[Nested foreign Fields - Many] Should work with foreign fields direct and inversed", async () => {
    manyToMany(A, B, {
      foreignField: "foreign.key",
      inversedLinkName: "as",
      linkName: "bs",
    });

    const b1 = await B.insertOne({
      foreign: {
        key: "someId1",
      },
      test: "123",
    });
    const b2 = await B.insertOne({
      foreign: {
        key: "someId2",
      },
      test: "123",
    });
    const b3 = await B.insertOne({
      foreign: {
        key: "someId3",
      },
      test: "shouldnotberetrieved",
    });

    await A.insertOne({
      bsIds: ["someId1", "someId2"],
      number: 123,
    });

    const result: any = await query(A, {
      _id: 1,
      bs: {
        test: 1,
      },
    }).fetchOne();

    assert.isArray(result.bs);
    assert.lengthOf(result.bs, 2);

    const result2: any[] = await query(B, {
      test: 1,
      as: {
        number: {},
      },
    }).fetch();

    result2.forEach((r) => {
      if (r.test === "shouldnotberetrieved") {
        assert.isArray(r.as);
        assert.lengthOf(r.as, 0);
      } else {
        assert.isArray(r.as);
        assert.lengthOf(r.as, 1);
      }
    });
  });

  it("[Defaults] If no link data is found respond with a null or [] depending on case", async () => {
    manyToMany(A, B, {
      field: "whateverIds",
      inversedLinkName: "as",
      linkName: "bs",
    });
    manyToOne(A, C, {
      field: "cId",
      inversedLinkName: "as",
      linkName: "c",
    });
    oneToOne(A, D, {
      field: "dId",
      inversedLinkName: "a",
      linkName: "d",
    });
    oneToMany(A, E, {
      field: "eIds",
      inversedLinkName: "a",
      linkName: "es",
    });

    await A.insertOne({ n: 10 });
    await B.insertOne({ n: 10 });
    await C.insertOne({ n: 10 });
    await D.insertOne({ n: 10 });

    const a = await query(A, {
      _id: 1,
      bs: {
        _id: 1,
      },
      c: {
        _id: 1,
      },
      d: {
        _id: 1,
      },
      es: {
        _id: 1,
      },
    }).fetchOne();

    assert.isNull(a.c);
    assert.isNull(a.d);
    assert.isArray(a.bs);
    assert.isArray(a.es);
    assert.lengthOf(a.bs, 0);
    assert.lengthOf(a.es, 0);

    const b = await query(B, {
      _id: 1,
      as: {
        _id: 1,
      },
    }).fetchOne();

    assert.isArray(b.as);
    assert.lengthOf(b.as, 0);

    const c = await query(C, {
      _id: 1,
      as: {
        _id: 1,
      },
    }).fetchOne();

    assert.isArray(c.as);
    assert.lengthOf(c.as, 0);

    const d = await query(D, {
      _id: 1,
      a: {
        _id: 1,
      },
    }).fetchOne();

    assert.isNull(d.a);

    const e = await query(D, {
      _id: 1,
      a: {
        _id: 1,
      },
    }).fetchOne();

    assert.isNull(e.a);
  });

  // When linking data is corrupt

  it("[Defaults] If link data is corrupt", async () => {
    manyToMany(A, B, {
      field: "whateverIds",
      inversedLinkName: "as",
      linkName: "bs",
    });
    manyToOne(A, C, {
      field: "cId",
      inversedLinkName: "as",
      linkName: "c",
    });
    oneToOne(A, D, {
      field: "dId",
      inversedLinkName: "a",
      linkName: "d",
    });
    oneToMany(A, E, {
      field: "eIds",
      inversedLinkName: "a",
      linkName: "es",
    });

    await A.insertOne({
      n: 10,
      whateverIds: 123,
      cId: { obj: 1 },
      eIds: [null],
      dId: null,
    });
    await B.insertOne({ n: 10 });
    await C.insertOne({ n: 10 });
    await D.insertOne({ n: 10 });

    const a = await query(A, {
      _id: 1,
      bs: {
        _id: 1,
      },
      c: {
        _id: 1,
      },
      d: {
        _id: 1,
      },
      es: {
        _id: 1,
      },
    }).fetchOne();

    assert.isNull(a.c);
    assert.isNull(a.d);
    assert.isArray(a.bs);
    assert.isArray(a.es);
    assert.lengthOf(a.bs, 0);
    assert.lengthOf(a.es, 0);

    const b = await query(B, {
      _id: 1,
      as: {
        _id: 1,
      },
    }).fetchOne();

    assert.isArray(b.as);
    assert.lengthOf(b.as, 0);

    const c = await query(C, {
      _id: 1,
      as: {
        _id: 1,
      },
    }).fetchOne();

    assert.isArray(c.as);
    assert.lengthOf(c.as, 0);

    const d = await query(D, {
      _id: 1,
      a: {
        _id: 1,
      },
    }).fetchOne();

    assert.isNull(d.a);

    const e = await query(D, {
      _id: 1,
      a: {
        _id: 1,
      },
    }).fetchOne();

    assert.isNull(e.a);
  });

  it("should allow limits and skips and sorts in nested direct links", async () => {
    const Posts = A;
    const Comments = B;

    manyToOne(Comments, Posts, {
      linkName: "post",
      inversedLinkName: "comments",
    });

    const p1 = await Posts.insertOne({});

    for (let i = 0; i < 50; i++) {
      await Comments.insertOne({
        number: i,
        postId: p1.insertedId,
      });
    }

    const post = await query(Posts, {
      _id: 1,
      comments: {
        $: {
          options: {
            sort: {
              number: -1,
            },
            limit: 10,
            skip: 10,
          },
        },
        number: 1,
        _id: 1,
      },
    }).fetchOne();

    assert.isObject(post);

    assert.lengthOf(post.comments, 10);
    assert.equal(post.comments[0].number, 39);
    assert.equal(post.comments[9].number, 30);
  });

  it("Should work with geonear points", async () => {
    await GeoPoint.createIndex({
      loc: "2dsphere",
    });

    // Sleep to ensure that index has been actually created
    await new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, 200);
    });

    await GeoPoint.insertOne({
      loc: { type: "Point", coordinates: [-73.99279, 40.719296] },
      name: "Central Park",
      category: "Parks",
    });

    const result = await query(GeoPoint, {
      $: {
        pipeline: [
          {
            $geoNear: {
              includeLocs: "loc",
              distanceField: "distance",
              near: { type: "Point", coordinates: [-73.99279, 40.719296] },
              maxDistance: 2,
            },
          },
        ],
      },
      name: 1,
    }).toArray();

    assert.lengthOf(result, 1);
  });

  it("Should work with hardwired filters", async () => {
    const Posts = A;
    const Comments = B;

    addLinks(Posts, {
      comments: {
        collection: () => Comments,
        inversedBy: "post",
        filters: {
          isApproved: true,
        },
      },
    });
    addLinks(Comments, {
      post: {
        collection: () => Posts,
        field: "postId",
      },
    });

    const p1 = await Posts.insertOne({});

    for (let i = 0; i < 10; i++) {
      await Comments.insertOne({
        number: i,
        postId: p1.insertedId,
        isApproved: i % 2 === 0,
      });
    }

    const post = await query(Posts, {
      _id: 1,
      comments: {
        $: {
          filters: {
            number: { $lte: 10 },
          },
          options: {
            sort: {
              number: 1,
            },
          },
        },
        number: 1,
        _id: 1,
      },
    }).fetchOne();

    assert.isObject(post);

    assert.lengthOf(post.comments, 5);
    assert.equal(post.comments[0].number, 0);
    assert.equal(post.comments[4].number, 8);
  });

  it("should work with $all", async () => {
    manyToOne(A, B, {
      linkName: "b",
      inversedLinkName: "a",
    });

    const b = await B.insertOne({
      name: "John",
      age: 20,
    });

    const a = await A.insertOne({
      bId: b.insertedId,
      number: 200,
      divsion: 3,
    });

    const result = await query(B, {
      $all: true,
      a: {
        $all: true,
      },
    }).fetchOne();

    assert.isObject(result);
    assert.isString(result.name);
    assert.isNumber(result.age);
    assert.isArray(result.a);
    assert.isNumber(result.a[0].number);
    assert.isDefined(result.a[0].bId);
  });

  it("should work with multi-level one results", async () => {
    oneToOne(A, B, {
      linkName: "b",
      inversedLinkName: "a",
    });
    oneToOne(B, C, {
      linkName: "c",
      inversedLinkName: "b",
    });
    oneToOne(C, D, {
      linkName: "d",
      inversedLinkName: "c",
    });
    const Employees = E;
    manyToOne(Employees, A, {
      linkName: "a",
      inversedLinkName: "e",
    });

    const d = await D.insertOne({ name: "D" });
    const c = await C.insertOne({ name: "C", dId: d.insertedId });
    const b = await B.insertOne({ name: "B", cId: c.insertedId });
    const a = await A.insertOne({ name: "A", bId: b.insertedId });
    await Employees.insertOne({ name: "John 1", aId: a.insertedId });
    await Employees.insertOne({ name: "John 2", aId: a.insertedId });
    await Employees.insertOne({ name: "John 3", aId: a.insertedId });

    // query a -> b -> c, c -> b -> a;
    const result1 = await query(A, {
      name: 1,
      b: {
        name: 1,
        c: {
          name: 1,
          d: {
            name: 1,
          },
        },
      },
    }).fetchOne();
    assert.equal(result1.b.c.d.name, "D");
    assert.equal(result1.b.c.name, "C");
    assert.equal(result1.b.name, "B");
    assert.equal(result1.name, "A");

    const result2 = await query(D, {
      name: 1,
      c: {
        name: 1,
        b: {
          name: 1,
          a: {
            name: 1,
          },
        },
      },
    }).fetchOne();
    assert.equal(result2.c.b.a.name, "A");
    assert.equal(result2.c.b.name, "B");
    assert.equal(result2.c.name, "C");
    assert.equal(result2.name, "D");

    const employees = await query(Employees, {
      name: 1,
      a: {
        name: 1,
        b: {
          name: 1,
          c: {
            name: 1,
          },
        },
      },
    }).fetch();

    assert.lengthOf(employees, 3);
    employees.forEach((employee) => {
      assert.equal(employee.a.name, "A");
      assert.equal(employee.a.b.name, "B");
      assert.equal(employee.a.b.c.name, "C");
    });
  });

  it("Should work with hint option", async () => {
    // Create an index on the collection
    await A.createIndex({ number: 1 }, { name: "number_1" });

    // Sleep to ensure that index has been actually created
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 200);
    });

    // Insert some test data
    await A.insertOne({ number: 100, name: "Test 1" });
    await A.insertOne({ number: 200, name: "Test 2" });
    await A.insertOne({ number: 300, name: "Test 3" });

    // Query with hint option
    const result = await query(A, {
      $: {
        filters: {
          number: { $gte: 100 },
        },
        options: {
          hint: "number_1",
          sort: { number: 1 },
        },
      },
      number: 1,
      name: 1,
    }).fetch();

    // Verify results
    assert.lengthOf(result, 3);
    assert.equal(result[0].number, 100);
    assert.equal(result[1].number, 200);
    assert.equal(result[2].number, 300);
    assert.equal(result[0].name, "Test 1");
    assert.equal(result[1].name, "Test 2");
    assert.equal(result[2].name, "Test 3");

    // Test with hint as index document
    const result2 = await query(A, {
      $: {
        filters: {
          number: { $gte: 200 },
        },
        options: {
          hint: { number: 1 },
          sort: { number: 1 },
        },
      },
      number: 1,
      name: 1,
    }).fetch();

    // Verify results
    assert.lengthOf(result2, 2);
    assert.equal(result2[0].number, 200);
    assert.equal(result2[1].number, 300);
  });
});
