import { createEcosystem } from "../helpers";
import { assert } from "chai";
import { Collection } from "../../models/Collection";
import timestampable from "../../behaviors/timestampable";
import blameable from "../../behaviors/blameable";

describe("Behaviors", () => {
  it("Should work with timestampable behaviors, context", async () => {
    const { container, teardown } = await createEcosystem();

    class Behaviors extends Collection<any> {
      static behaviors = [timestampable(), blameable()];
      static collectionName = "behaviorsTEST";
    }

    const userIdToUpdate = "123";
    const userIdToCreate = "XXX";
    const userIdToCreate2 = "YYY";

    const behaviors = container.get(Behaviors);

    const getQueryBody = (insertedId: any) => ({
      $: {
        filters: {
          _id: insertedId,
        },
      },
      createdAt: 1,
      updatedAt: 1,
      createdById: 1,
      updatedById: 1,
    });

    const b0 = await behaviors.insertOne({
      test: 1,
      createdById: userIdToCreate,
    });

    const b0Object = await behaviors.queryOne(getQueryBody(b0.insertedId));

    assert.equal(b0Object.createdById, userIdToCreate);

    const b1 = await behaviors.insertOne(
      {
        test: 1,
        createdById: userIdToCreate2,
      },
      {
        context: {
          userId: userIdToCreate,
        },
      }
    );

    let b1Object = await behaviors.queryOne(getQueryBody(b1.insertedId));

    assert.instanceOf(b1Object.createdAt, Date);
    assert.instanceOf(b1Object.updatedAt, Date);
    assert.isTrue(
      b1Object.createdAt.getTime() === b1Object.updatedAt.getTime()
    );

    assert.equal(b1Object.createdById, userIdToCreate);
    assert.equal(b1Object.updatedById, userIdToCreate);

    await behaviors.updateOne(
      {
        _id: b1.insertedId,
      },
      {
        $set: {
          test: 45,
        },
      },
      {
        context: {
          userId: userIdToUpdate,
        },
      }
    );

    b1Object = await behaviors.queryOne(getQueryBody(b1.insertedId));

    assert.isTrue(b1Object.updatedAt > b1Object.createdAt);

    assert.equal(b1Object.createdById, userIdToCreate);
    assert.equal(b1Object.updatedById, userIdToUpdate);

    teardown();
  });

  it("Should work with updateMany and insertMany", async () => {
    const { container, teardown } = await createEcosystem();

    class Behaviors extends Collection<any> {
      static behaviors = [timestampable(), blameable()];
      static collectionName = "behaviorsTEST";
    }

    const userIdToUpdate = "123";
    const userIdToCreate = "XXX";

    const behaviors = container.get(Behaviors);

    await behaviors.deleteMany({});
    const b1 = await behaviors.insertMany(
      [
        {
          test: 1,
        },
        {
          test: 2,
        },
        {
          test: 3,
        },
      ],
      {
        context: {
          userId: userIdToCreate,
        },
      }
    );

    const queryBody = {
      createdAt: 1,
      updatedAt: 1,
      createdById: 1,
      updatedById: 1,
    };

    let b1s = await behaviors.query(queryBody);

    assert.lengthOf(b1s, 3);
    b1s.forEach((b1s) => {
      assert.instanceOf(b1s.createdAt, Date);
      assert.instanceOf(b1s.updatedAt, Date);
      assert.isTrue(b1s.createdAt.getTime() === b1s.updatedAt.getTime());

      assert.equal(b1s.createdById, userIdToCreate);
      assert.equal(b1s.updatedById, userIdToCreate);
    });

    await behaviors.updateMany(
      {},
      {
        $set: {
          test: 45,
        },
      },
      {
        context: {
          userId: userIdToUpdate,
        },
      }
    );

    b1s = await behaviors.query(queryBody);

    b1s.forEach((b1s) => {
      assert.isTrue(b1s.updatedAt > b1s.createdAt);

      assert.equal(b1s.createdById, userIdToCreate);
      assert.equal(b1s.updatedById, userIdToUpdate);
    });

    teardown();
  });
});
