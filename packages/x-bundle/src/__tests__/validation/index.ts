import {
  Schema,
  Is,
  a,
  an,
  ValidatorService,
} from "@bluelibs/validator-bundle";
import { ObjectId } from "@bluelibs/ejson";
import { createKernel } from "./createEcosystem";
import { Collection } from "@bluelibs/mongo-bundle";
import { Service } from "@bluelibs/core";

describe("validation", () => {
  test("it should work ok with validation", async () => {
    const kernel = createKernel();
    await kernel.init();
    const container = kernel.container;
    @Service()
    class Messages extends Collection {
      static collectionName = "messages";
    }

    const messagesCollection = container.get(Messages);
    await messagesCollection.deleteMany({});

    @Schema()
    class Dummy {
      @Is(a.date().format("YYYY-MM-DD"))
      date: Date = new Date();

      @Is(a.objectId())
      newId: ObjectId = new ObjectId();

      @Is(
        a.string().uniqueField({
          collection: Messages,
          field: "text",
          message: "Duplicated text",
        })
      )
      text: string;
    }

    const result = new Dummy();
    result.text = "hello";

    const validator = container.get(ValidatorService);

    await validator.validate(result);

    await messagesCollection.insertOne({ text: "hello" });
    await expect(validator.validate(result)).rejects.toBeInstanceOf(Error);

    await kernel.shutdown();
  });

  test("Works with optional objectId", async () => {
    const kernel = createKernel();
    await kernel.init();
    const container = kernel.container;

    @Schema()
    class Dummy {
      @Is(a.objectId())
      newId: ObjectId;
    }

    const dummy = new Dummy();

    const validator = container.get(ValidatorService);

    const result = await validator.validate(dummy); // should be ok

    await kernel.shutdown();
  });
});
