import { getEcosystem } from "../helpers";
import softdeletable from "../../behaviors/softdeletable";
import { Collection } from "../..";

describe("Softdeletable behavior", () => {
  it("Should soft-delete one or more documents and not be able to be found via find, findOne, findOneAndUpdate, aggregate", async () => {
    const { container } = await getEcosystem();

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

    expect(await collection.findOne({ _id: result.insertedId })).toBeInstanceOf(
      Object
    );

    await collection.deleteOne({ _id: result.insertedId });

    expect(await collection.findOne({ _id: result.insertedId })).toBeNull();
    expect(
      await collection.findOne({ _id: result.insertedId, isDeleted: true })
    ).toBeInstanceOf(Object);

    expect(
      await collection.find({ _id: result.insertedId }).toArray()
    ).toHaveLength(0);

    expect(
      await collection
        .find({ _id: result.insertedId, isDeleted: true })
        .toArray()
    ).toHaveLength(1);

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

    expect(obj.title === "findOneAndUpdated").toBe(false);

    await collection.findOneAndDelete({ _id: result.insertedId });
    expect(
      await collection.findOne({ _id: result.insertedId, isDeleted: true })
    ).toBeTruthy();

    let aggregateResult = await collection
      .aggregate([
        {
          $match: { _id: result.insertedId },
        },
      ])
      .toArray();

    expect(aggregateResult).toHaveLength(0);

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

    expect(aggregateResult).toHaveLength(1);
  });

  it("Shouldnt allow to update deleted elements without explicit specification", async () => {
    const { container } = await getEcosystem();

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

    expect(obj.title).toEqual("Hello my friend");
  });

  it("Should create an index on the isDeleted field", async () => {
    const { container } = await getEcosystem();

    class SoftdeletableCollectionIndexed extends Collection<any> {
      static behaviors = [softdeletable()];
      static collectionName = "softdeletable_indexed_test";
    }

    const collection = container.get<SoftdeletableCollectionIndexed>(
      SoftdeletableCollectionIndexed
    );

    // Ensure collection is initialized, which should create the index
    await collection.countDocuments({});

    const indexes = await collection.collection.listIndexes().toArray();
    const isDeletedIndex = indexes.find((idx) => idx.key?.isDeleted === 1);

    expect(isDeletedIndex).toBeDefined();
    expect(isDeletedIndex?.name).toBe("isDeleted_1");
  });

  // TODO:
  // Test events dispatching correctly, not update but remove
});
