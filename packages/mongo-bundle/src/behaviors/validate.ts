import { Collection } from "../models/Collection";
import { IValidateBehaviorOptions, IContextAware } from "../defs";
import { ValidatorService } from "@bluelibs/validator-bundle";
import {
  BeforeInsertEvent,
  BeforeUpdateEvent,
  AfterUpdateEvent,
} from "../events";
import * as MongoDB from "mongodb";
import { DatabaseService } from "../services/DatabaseService";

// Some things here can be re-used between updateOne, updateMany and findOneAndUpdate
// However we find that this is the clearest way of coding

export default function validate(behaviorOptions: IValidateBehaviorOptions) {
  behaviorOptions.options = behaviorOptions.options || {};
  behaviorOptions.castOptions = behaviorOptions.castOptions || {};

  return (collection: Collection) => {
    const validatorService =
      collection.container.get<ValidatorService>(ValidatorService);
    const dbService =
      collection.container.get<DatabaseService>(DatabaseService);

    collection.localEventManager.addListener(
      BeforeInsertEvent,
      async (e: BeforeInsertEvent) => {
        let document = e.data.document;
        if (behaviorOptions.cast) {
          document = validatorService.cast(e.data.document, {
            ...behaviorOptions.castOptions,
            model: behaviorOptions.model,
          });
        }

        e.data.document = await validatorService.validate(document, {
          ...behaviorOptions.options,
          model: behaviorOptions.model,
        });
      }
    );

    // Our current strategy is to execute update in a transaction, fetch the document and validate it fully.
    // This may not be the most efficient way to do it, but it is the safest way especially when validation of fields
    // depends on other fields.

    // Other efficient ways would be to fetch only the fields needed, try to execute the update locally (may result in some strange edge-cases), and validate
    // Other would be to update within transaction, and then fetch only then needed fields and perform a "subschema" validation

    // If we were to implement this I would imagine a `strategy` option for the behavior so someone that knows can understand the impact
    // and decide which use-case is best for them.

    collection.updateOne = async (
      filter: MongoDB.Filter<any>,
      update: MongoDB.UpdateFilter<any>,
      options: IContextAware & MongoDB.UpdateOptions = {}
    ) => {
      let result = null;
      const fields = dbService.getFields(update);

      await dbService.transact(async (session) => {
        // first we find it so we can retrieve it later
        const element = await collection.findOne(filter, {
          projection: { _id: 1 },
          session,
        });

        // dispatch before update

        await collection.emit(
          new BeforeUpdateEvent({
            filter,
            update,
            isMany: false,
            context: options?.context,
            fields,
            options: {
              ...options,
              session,
            },
          })
        );

        if (!element) {
          return;
        }

        result = await collection.collection.updateOne(
          { _id: element._id },
          update,
          {
            ...options,
            session,
          }
        );

        const document = await collection.findOne(
          { _id: element._id },
          { session }
        );
        await validatorService.validate(document, {
          ...behaviorOptions.options,
          model: behaviorOptions.model,
        });
      });

      // No exception occured
      await collection.emit(
        new AfterUpdateEvent({
          filter,
          update,
          isMany: false,
          context: options?.context,
          fields,
          result,
          options,
        })
      );

      return result as any;
    };

    collection.updateMany = async (
      filter: MongoDB.Filter<any>,
      update: MongoDB.UpdateFilter<any>,
      options: IContextAware & MongoDB.UpdateOptions = {}
    ) => {
      let result;
      const fields = dbService.getFields(update);

      await dbService.transact(async () => {
        // first we find it so we can retrieve it later
        const elements = await collection
          .find(filter, {
            projection: { _id: 1 },
          })
          .toArray();

        // dispatch before update

        await collection.emit(
          new BeforeUpdateEvent({
            filter,
            update,
            isMany: true,
            context: options?.context,
            fields,
            options,
          })
        );

        const elementsIds = elements.map((e) => e._id);

        result = await collection.collection.updateMany(
          { _id: { $in: elementsIds } },
          update,
          options
        );

        const documents = await collection
          .find({ _id: { $in: elementsIds } })
          .toArray();

        for (const document of documents) {
          await validatorService.validate(document, {
            ...behaviorOptions.options,
            model: behaviorOptions.model,
          });
        }
      });

      // No exception occured
      await collection.emit(
        new AfterUpdateEvent({
          filter,
          update,
          isMany: true,
          context: options?.context,
          fields,
          result,
          options,
        })
      );

      return result as any;
    };

    collection.findOneAndUpdate = async (
      filter: MongoDB.Filter<any> = {},
      update: MongoDB.UpdateFilter<any>,
      options: IContextAware & MongoDB.FindOneAndUpdateOptions = {}
    ) => {
      let result;
      const fields = dbService.getFields(update);

      await dbService.transact(async () => {
        await collection.emit(
          new BeforeUpdateEvent({
            filter,
            update,
            isMany: false,
            context: options?.context,
            fields,
            options,
          })
        );
        const element = await collection.collection.findOneAndUpdate(
          filter,
          update,
          options
        );

        if (!element.value) {
          // No element was found
          return;
        }

        // Test if the update worked and is consistent
        const document = await collection.findOne({ _id: element.value._id });
        await validatorService.validate(document, {
          ...behaviorOptions.options,
          model: behaviorOptions.model,
        });
      });

      // No exception occured
      collection.emit(
        new AfterUpdateEvent({
          filter,
          update,
          isMany: false,
          context: options?.context,
          fields,
          result,
          options,
        })
      );

      return result as any;
    };
  };
}
