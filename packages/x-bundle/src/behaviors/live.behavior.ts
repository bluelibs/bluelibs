import {
  Collection,
  AfterInsertEvent,
  AfterUpdateEvent,
  BeforeUpdateEvent,
  BeforeDeleteEvent,
  AfterDeleteEvent,
  BehaviorType,
} from "@bluelibs/mongo-bundle";
import { DocumentMutationType, MESSENGER } from "../constants";
import { IMessenger } from "../defs";
import { getFields } from "../utils/getFields";
export const LIVE_BEHAVIOR_MARKER = Symbol("HasLiveBehavior");

function shouldSkipLive(context) {
  return context ? context.live?.disable === true : false;
}

const LiveDataInfoTransfer = Symbol("LiveDataInfoTransfer");

export function Live(): BehaviorType {
  return (collection: Collection<any>) => {
    collection[LIVE_BEHAVIOR_MARKER] = true;

    const messenger = collection.container.get<IMessenger>(MESSENGER);
    collection.localEventManager.addListener(
      AfterInsertEvent,
      (e: AfterInsertEvent) => {
        if (shouldSkipLive(e.data.context)) {
          return;
        }

        const channels = [
          ...(e.data.context.live?.channels || []),
          collection.collectionName,
          `${collection.collectionName}::${e.data._id}`,
        ];

        messenger.publish(channels, {
          documentId: e.data._id,
          mutationType: DocumentMutationType.INSERT,
        });
      }
    );
    collection.localEventManager.addListener(
      BeforeUpdateEvent,
      async (e: BeforeUpdateEvent) => {
        if (shouldSkipLive(e.data.context)) {
          return;
        }

        const documentsToUpdate = await collection
          .find(e.data.filter, {
            ...e.data.options,
            projection: { _id: 1 },
          })
          .toArray();
        const documentIdsToUpdate = documentsToUpdate.map((d) => d._id);

        const context = e.data.context;
        context[LiveDataInfoTransfer] = {
          documentIdsToUpdate,
        };

        // We do this to ensure that in the meantime no other update is triggered
        e.data.filter._id = { $in: documentIdsToUpdate };
      }
    );
    collection.localEventManager.addListener(
      AfterUpdateEvent,
      (e: AfterUpdateEvent) => {
        if (shouldSkipLive(e.data.context)) {
          return;
        }

        const context = e.data.context;
        const updatedIds = context[LiveDataInfoTransfer].documentIdsToUpdate;
        const modifiedFields = getFields(e.data.update);

        updatedIds.forEach((_id) => {
          messenger.publish(
            [
              ...(e.data.context.live?.channels || []),
              collection.collectionName,
              `${collection.collectionName}::${_id}`,
            ],
            {
              documentId: _id,
              modifiedFields: modifiedFields.topLevelFields,
              mutationType: DocumentMutationType.UPDATE,
            }
          );
        });
      }
    );

    collection.localEventManager.addListener(
      BeforeDeleteEvent,
      async (e: BeforeDeleteEvent) => {
        if (shouldSkipLive(e.data.context)) {
          return;
        }

        const documentsToRemove = await collection
          .find(e.data.filter, {
            ...e.data.options,
            projection: { _id: 1 },
          })
          .toArray();
        const documentIds = documentsToRemove.map((d) => d._id);

        const context = e.data.context;
        context[LiveDataInfoTransfer] = {
          documentIds,
        };

        // We do this to ensure that in the meantime no other update is triggered
        e.data.filter._id = { $in: documentIds };
      }
    );

    collection.localEventManager.addListener(
      AfterDeleteEvent,
      (e: AfterDeleteEvent) => {
        if (shouldSkipLive(e.data.context)) {
          return;
        }

        const context = e.data.context;
        const updatedIds = context[LiveDataInfoTransfer]?.documentIds || [];

        updatedIds.forEach((_id) => {
          messenger.publish(
            [
              ...(e.data.context.live?.channels || []),
              collection.collectionName,
              `${collection.collectionName}::${_id}`,
            ],
            {
              documentId: _id,
              mutationType: DocumentMutationType.REMOVE,
            }
          );
        });
      }
    );
  };
}
