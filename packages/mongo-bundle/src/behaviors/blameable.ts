import { BeforeInsertEvent, BeforeUpdateEvent } from "../events";
import {
  IBlameableBehaviorOptions,
  BehaviorType,
  IExecutionContext,
} from "../defs";
import { Collection } from "../models/Collection";
import * as MongoDB from "mongodb";

export default function blameable(
  options: IBlameableBehaviorOptions = {}
): BehaviorType {
  const fields = options.fields || {
    createdBy: "createdById",
    updatedBy: "updatedById",
  };
  const throwErrorWhenMissing = options.throwErrorWhenMissing || false;
  const nullishUpdatedByAtInsert = options.keepInitialUpdateAsNull || false;

  const extractUserID = (context: IExecutionContext | null) => {
    if (!context) {
      return null;
    }

    return context.userId;
  };

  const checkUserId = <T extends MongoDB.Document>(
    userId: unknown,
    collection: Collection<T>
  ) => {
    if (userId === undefined && throwErrorWhenMissing) {
      throw new Error(
        `You have to provide { userId } inside the context when you perform this insert mutation on ${collection.collectionName} collection.`
      );
    }
  };

  return <T extends MongoDB.Document>(collection: Collection<T>) => {
    collection.localEventManager.addListener(
      BeforeInsertEvent,
      // @ts-expect-error - handler uses CollectionEvent subclass
      (e: BeforeInsertEvent) => {
        const { context } = e.data;

        const userId = extractUserID(context);

        checkUserId(userId, collection);

        if (userId === undefined) return;

        const document = e.data.document;

        Object.assign(document, {
          [fields.createdBy]: userId,
          [fields.updatedBy]: nullishUpdatedByAtInsert ? null : userId,
        });
      }
    );

    collection.localEventManager.addListener(
      BeforeUpdateEvent,
      // @ts-expect-error - handler uses CollectionEvent subclass
      (e: BeforeUpdateEvent) => {
        const { context } = e.data;

        const userId = extractUserID(context);

        checkUserId(userId, collection);

        if (userId === undefined) return;

        const update = e.data.update;

        if (!update.$set) {
          update.$set = {};
        }

        Object.assign(update.$set, {
          [fields.updatedBy]: userId,
        });
      }
    );
  };
}
