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
      // @ts-expect-error - handler uses CollectionEvent subclass
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

    // The strategy is to apply the update, fetch the resulting document and validate it fully.
    // This may not be the most efficient way to do it, but it is the safest way especially when validation of fields
    // depends on other fields.
    //
    // Previously we wrapped this in a MongoDB transaction to keep the database consistent when validation fails.
    // Because transactions require a replica set, we instead restore the original documents on failure so this
    // behavior also works against a standalone MongoDB instance.

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

      // first we find it so we can retrieve it later
      const element = await collection.findOne(filter, {
        projection: { _id: 1 },
      });

      // dispatch before update

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

      if (!element) {
        return result;
      }

      // Keep the original document so we can restore it if validation fails.
      const original = await collection.collection.findOne({
        _id: element._id,
      });

      result = await collection.collection.updateOne(
        // The reason we pass-on filter is to ensure that positional array pushes still work.
        { ...filter, _id: element._id },
        update,
        options
      );

      const document = await collection.findOne({ _id: element._id });

      try {
        await validatorService.validate(document, {
          ...behaviorOptions.options,
          model: behaviorOptions.model,
        });
      } catch (error) {
        // Restore the original document so we don't persist invalid data.
        if (original) {
          await collection.collection.replaceOne(
            { _id: element._id },
            original
          );
        }
        throw error;
      }

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
      const fields = dbService.getFields(update);

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

      // Keep the original documents so we can restore them if validation fails.
      const originals = elementsIds.length
        ? await collection.collection
            .find({ _id: { $in: elementsIds } })
            .toArray()
        : [];

      const result = await collection.collection.updateMany(
        { _id: { $in: elementsIds } },
        update,
        options
      );

      const documents = await collection
        .find({ _id: { $in: elementsIds } })
        .toArray();

      try {
        for (const document of documents) {
          await validatorService.validate(document, {
            ...behaviorOptions.options,
            model: behaviorOptions.model,
          });
        }
      } catch (error) {
        // Restore the original documents so we don't persist invalid data.
        for (const original of originals) {
          await collection.collection.replaceOne(
            { _id: original._id },
            original
          );
        }
        throw error;
      }

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
      const fields = dbService.getFields(update);

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

      // Keep the original document so we can restore it if validation fails.
      const element = await collection.collection.findOne(filter);

      // includeResultMetadata must be forced: the raw driver defaults it to
      // false (returning the document directly), which would make result.value
      // undefined and silently skip validation.
      const result = await collection.collection.findOneAndUpdate(
        filter,
        update,
        { ...options, includeResultMetadata: true }
      );

      // Validate the POST-update state. result.value is the pre-image
      // (returnDocument defaults to "before"); for an upsert-insert there is
      // no pre-image, so fall back to the filter's _id.
      const documentId =
        (result.value as { _id?: unknown } | null)?._id ??
        (filter as { _id?: unknown })._id ??
        (element as { _id?: unknown } | null)?._id;

      if (documentId) {
        const document = await collection.findOne({ _id: documentId as any });

        if (document) {
          try {
            await validatorService.validate(document, {
              ...behaviorOptions.options,
              model: behaviorOptions.model,
            });
          } catch (error) {
            if (element) {
              await collection.collection.replaceOne(
                { _id: element._id },
                element
              );
            }
            throw error;
          }
        }
      }

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
  };
}
