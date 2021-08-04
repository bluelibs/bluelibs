import { createEcosystem } from "../helpers";
import softdeletable from "../../behaviors/softdeletable";
import { Collection } from "../..";
import { assert } from "chai";

describe("Softdeletable behavior", () => {
  it("Should soft-delete one or more documents and not be able to be found via find, findOne, findOneAndUpdate, aggregate", async () => {
    const { container, teardown } = await createEcosystem();

    class SoftdeletableCollection extends Collection<any> {
      static behaviors = [softdeletable()];
      static collectionName = "softdeletable1";
    }

    const collection = container.get<SoftdeletableCollection>(
      SoftdeletableCollection
    );

    const result = await collection.insertOne({
      title: "Hello my friend",
    });

    assert.isObject(await collection.findOne({ _id: result.insertedId }));

    await collection.deleteOne({ _id: result.insertedId });

    assert.isNull(await collection.findOne({ _id: result.insertedId }));
    assert.isObject(
      await collection.findOne({ _id: result.insertedId, isDeleted: true })
    );

    assert.lengthOf(
      await collection.find({ _id: result.insertedId }).toArray(),
      0
    );
    assert.lengthOf(
      await collection
        .find({ _id: result.insertedId, isDeleted: true })
        .toArray(),
      1
    );

    await collection.findOneAndUpdate(
      { _id: result.insertedId },
      {
        $set: {
          title: "findOneAndUpdated",
        },
      }
    );
    let obj = await collection.findOne({
      _id: result.insertedId,
      isDeleted: true,
    });
    assert.notEqual(obj.title, "findOneAndUpdated");

    await collection.findOneAndDelete({ _id: result.insertedId });
    assert.isObject(
      await collection.findOne({ _id: result.insertedId, isDeleted: true })
    );

    let aggregateResult = await collection
      .aggregate([
        {
          $match: { _id: result.insertedId },
        },
      ])
      .toArray();

    assert.lengthOf(aggregateResult, 0);

    aggregateResult = await collection
      .aggregate([
        {
          $match: { _id: result.insertedId },
        },
        {
          $match: { isDeleted: true },
        },
      ])
      .toArray();

    assert.lengthOf(aggregateResult, 1);

    teardown();
  });

  it("Shouldnt allow to update deleted elements without explicit specification", async () => {
    const { container, teardown } = await createEcosystem();

    class SoftdeletableCollection extends Collection<any> {
      static behaviors = [softdeletable()];
      static collectionName = "softdeletable1";
    }

    const collection = container.get<SoftdeletableCollection>(
      SoftdeletableCollection
    );

    const result = await collection.insertOne({
      title: "Hello my friend",
    });

    await collection.deleteMany({});

    await collection.updateMany(
      {},
      {
        $set: {
          title: "x",
        },
      }
    );

    let obj = await collection.findOne({
      _id: result.insertedId,
      isDeleted: true,
    });

    assert.equal(obj.title, "Hello my friend");

    teardown();
  });

  // TODO:
  // Test events dispatching correctly, not update but remove
});
