import { getEcosystem } from "../helpers";
import { Collection } from "../../models/Collection";
import timestampable from "../../behaviors/timestampable";
import blameable from "../../behaviors/blameable";

describe("Behaviors", () => {
  it("Should work with timestampable behaviors, context", async () => {
    const { container } = await getEcosystem();

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

    expect(b0Object.createdById).toEqual(userIdToCreate);

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

    expect(b1Object.createdAt).toBeInstanceOf(Date);
    expect(b1Object.updatedAt).toBeInstanceOf(Date);
    expect(b1Object.createdAt.getTime() === b1Object.updatedAt.getTime()).toBe(
      true
    );

    expect(b1Object.createdById).toEqual(userIdToCreate);
    expect(b1Object.updatedById).toEqual(userIdToCreate);

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

    expect(b1Object.updatedAt > b1Object.createdAt).toBe(true);

    expect(b1Object.createdById).toEqual(userIdToCreate);
    expect(b1Object.updatedById).toEqual(userIdToUpdate);
  });

  it("Should work with updateMany and insertMany", async () => {
    const { container } = await getEcosystem();

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

    expect(b1s).toHaveLength(3);
    b1s.forEach((b1s) => {
      expect(b1s.createdAt).toBeInstanceOf(Date);
      expect(b1s.updatedAt).toBeInstanceOf(Date);
      expect(b1s.createdAt.getTime() === b1s.updatedAt.getTime()).toBe(true);

      expect(b1s.createdById).toEqual(userIdToCreate);
      expect(b1s.updatedById).toEqual(userIdToCreate);
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
      expect(b1s.updatedAt > b1s.createdAt).toBe(true);

      expect(b1s.createdById).toEqual(userIdToCreate);
      expect(b1s.updatedById).toEqual(userIdToUpdate);
    });
  });

  it("Should set automatic `updatedAt` and `updatedBy` values to null if required to", async () => {
    const { container } = await getEcosystem();

    class Behaviors extends Collection<any> {
      static behaviors = [
        timestampable({ nullishUpdatedAtAtInsert: true }),
        blameable({ nullishUpdatedByAtInsert: true }),
      ];
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

    const b0 = await behaviors.insertOne(
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

    let b0Object = await behaviors.queryOne(getQueryBody(b1.insertedId));

    expect(b0Object.updatedAt).toBeInstanceOf(null);
    expect(b0Object.updatedById).toEqual(null);

    await behaviors.updateOne(
      {
        _id: b0.insertedId,
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

    b0Object = await behaviors.queryOne(getQueryBody(b0.insertedId));

    expect(b0Object.updatedAt > b0Object.createdAt).toBe(true);

    expect(b0Object.createdById).toEqual(userIdToCreate);
    expect(b0Object.updatedById).toEqual(userIdToUpdate);
  });
});
