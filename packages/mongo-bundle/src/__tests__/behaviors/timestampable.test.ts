import { describe, it, expect } from "@jest/globals";
import { Schema } from "@bluelibs/validator-bundle";
import timestampable from "../../behaviors/timestampable";
import { Collection } from "../../models/Collection";
import { BehaviorType } from "../../defs";
import { getEcosystem } from "../helpers";
import { ObjectId } from "mongodb";

describe("timestampable behavior", () => {
  it("should set createdAt and updatedAt on insert if not provided", async () => {
    const { container } = await getEcosystem();

    @Schema()
    class User {
      name: string;
    }

    class UserCollection extends Collection<any> {
      static collectionName = "users_timestampable_test_1";
      static behaviors: BehaviorType[] = [timestampable()];
    }

    const collection = container.get<UserCollection>(UserCollection);
    const result = await collection.insertOne({ name: "John" });
    const doc = await collection.findOne({ _id: result.insertedId });
    expect(doc?.createdAt).toBeInstanceOf(Date);
    expect(doc?.updatedAt).toBeInstanceOf(Date);
  });

  it("should update the updatedAt field on update but preserve createdAt", async () => {
    const { container } = await getEcosystem();

    @Schema()
    class User {
      name: string;
    }

    class UserCollection extends Collection<any> {
      static collectionName = "users_timestampable_test_2";
      static behaviors: BehaviorType[] = [timestampable({})];
    }

    const collection = container.get<UserCollection>(UserCollection);
    const result = await collection.insertOne({ name: "John" });
    const originalDoc = await collection.findOne({ _id: result.insertedId });
    const originalCreatedAt = originalDoc?.createdAt;
    const originalUpdatedAt = originalDoc?.updatedAt;

    await collection.updateOne(
      { _id: result.insertedId },
      { $set: { name: "Smith" } }
    );
    const updatedDoc = await collection.findOne({ _id: result.insertedId });

    expect(updatedDoc?.createdAt).toEqual(originalCreatedAt);
    expect(updatedDoc?.updatedAt).not.toEqual(originalUpdatedAt);
  });

  it("should keep updatedAt as null initially if keepInitialUpdateAsNull is true", async () => {
    const { container } = await getEcosystem();

    @Schema()
    class User {
      name: string;
    }

    class UserCollection extends Collection<any> {
      static collectionName = "users_timestampable_test_3";
      static behaviors: BehaviorType[] = [
        timestampable({ keepInitialUpdateAsNull: true }),
      ];
    }

    const collection = container.get<UserCollection>(UserCollection);
    const result = await collection.insertOne({ name: "John" });
    const doc = await collection.findOne({ _id: result.insertedId });

    expect(doc?.createdAt).toBeInstanceOf(Date);
    expect(doc?.updatedAt).toBeNull();
  });

  it("should set createdAt when using upsert if originally not provided", async () => {
    const { container } = await getEcosystem();

    @Schema()
    class User {
      name?: string;
    }

    class UserCollection extends Collection<any> {
      static collectionName = "users_timestampable_test_4";
      static behaviors: BehaviorType[] = [timestampable()];
    }

    const collection = container.get<UserCollection>(UserCollection);
    const name = "UpsertJohn" + Math.random();
    await collection.updateOne({ name }, { $set: { name } }, { upsert: true });

    const doc = await collection.findOne({ name });
    expect(doc?.createdAt).toBeInstanceOf(Date);
    expect(doc?.updatedAt).toBeInstanceOf(Date);
  });

  it("should handle upsert with $set and $setOnInsert properly", async () => {
    const { container } = await getEcosystem();

    @Schema()
    class User {
      valid?: boolean;
    }

    class UserCollection extends Collection<any> {
      static collectionName = "users_timestampable_test_5";
      static behaviors: BehaviorType[] = [timestampable()];
    }

    const collection = container.get<UserCollection>(UserCollection);

    const objectId = new ObjectId();
    await collection.updateOne(
      { _id: objectId },
      { $set: { valid1: true }, $setOnInsert: { valid: false } },
      { upsert: true }
    );

    const doc = await collection.findOne({ _id: objectId });
    expect(doc?.createdAt).toBeInstanceOf(Date);
    expect(doc?.updatedAt).toBeInstanceOf(Date);
    // Since it was newly inserted, $setOnInsert applies
    expect(doc?.valid).toBe(false);
  });
});
