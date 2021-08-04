import { createEcosystem } from "../helpers";
import { Collection } from "../..";
import validate from "../../behaviors/validate";
import { Schema, Is, a, ValidationError } from "@bluelibs/validator-bundle";

describe("Validate behavior", () => {
  it("Should be able to validate on insert and update", async () => {
    const { container, teardown } = await createEcosystem();

    @Schema()
    class User {
      @Is(a.string().required())
      name: string;

      @Is(a.number().max(100))
      age: number;
    }

    class UserCollection extends Collection<any> {
      static behaviors = [
        validate({
          model: User,
        }),
      ];
      static collectionName = "users";
    }

    const collection = container.get<UserCollection>(UserCollection);

    expect(
      collection.insertOne({
        name: "John",
        age: 101,
      })
    ).rejects.toBeInstanceOf(ValidationError);

    const result = await collection.insertOne({
      name: "John",
      age: 99,
      extraField: "test",
    });

    await expect(
      collection.updateOne(
        { _id: result.insertedId },
        {
          $set: {
            name: "Smith",
            age: 101,
          },
        }
      )
    ).rejects.toBeInstanceOf(ValidationError);

    await expect(
      collection.updateOne(
        { _id: result.insertedId },
        {
          $set: {
            age: 55,
          },
          $unset: {
            name: 1,
          },
        }
      )
    ).rejects.toBeInstanceOf(ValidationError);

    // This one should work
    await collection.updateOne(
      { _id: result.insertedId },
      {
        $set: {
          age: 55,
          name: "Smithsonian",
        },
      }
    );

    // Ensure this works
    await expect(
      collection.updateMany(
        {},
        {
          $set: {
            age: 102,
          },
        }
      )
    ).rejects.toBeInstanceOf(ValidationError);

    teardown();
  });
});
