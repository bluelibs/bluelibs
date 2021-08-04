// Responsible of starting sub and reading from Messenger
// Responsible of managing/updating the store
// And emitting corresponding events to their handlers
// When processor doesn't have a handle anymore, it should die.

import { Collection } from "@bluelibs/mongo-bundle";
import { IChangeSet, IDocumentBase, ISubscriptionEvent } from "../defs";
import { DocumentStore } from "./DocumentStore";
import { IMessenger } from "../defs";
import { SubscriptionHandler } from "./SubscriptionHandler";
import { extractIdsFromSelectors } from "../utils/extractIdsFromSelectors";
import { Strategy, DocumentMutationType } from "../constants";
import { hasSortFields } from "../utils/hasSortFields";
import { SubscriptionStore } from "../services/SubscriptionStore";
import { ICollectionQueryConfig, QueryBodyType } from "@bluelibs/nova";
import { getFieldsFromQueryBody, getAllowedFields } from "./utils/fields";
import { getChangedSet } from "./utils/getChangedSet";

export class SubscriptionProcessor<T extends IDocumentBase> {
  protected collectionName: string;
  protected strategy: Strategy;
  protected _ready = false;
  protected filtersAreEmpty = false;
  protected allowedFields: null | string[] = null;
  public readonly filters: any;
  public readonly options: any;
  public channels = [];
  public handlers: SubscriptionHandler<T>[] = [];
  public readonly documentStore: DocumentStore<T> = new DocumentStore<T>();

  /**
   * This id is a unique identifier of this subscription
   */
  public id = "";

  constructor(
    protected readonly messenger: IMessenger,
    protected readonly isDebug: boolean,
    public readonly collection: Collection<any>,
    protected readonly body: QueryBodyType,
    protected readonly subscriptionOptions: SubscriptionProcessorOptionsType = {}
  ) {
    this.collectionName = collection.collectionName;
    const { filters, options } = body.$ as ICollectionQueryConfig;
    this.filters = filters;
    this.options = options;
    this.allowedFields = getFieldsFromQueryBody(body);
    this.strategy = this.getStrategy(filters, options);
    this.id = SubscriptionStore.getSubscriptionId(collection, body);

    this.channels =
      subscriptionOptions.channels || this.getSubscriptionChannels(filters);
    if (Object.keys(filters).length === 0) {
      this.filtersAreEmpty = true;
    }

    this.isDebug &&
      console.log(
        `[processors] Created new processor with strategy: "${this.strategy}" and id: "${this.id}"`
      );
  }

  async start(): Promise<void> {
    const documents = await this.collection.query(this.body);

    documents.forEach((document) => {
      // TODO: fix
      this.documentStore.add(document as any);
    });

    this.channels.forEach((channel) => {
      this.messenger.subscribe(channel, this.process);
    });
  }

  async stop(): Promise<void> {
    // Delete / Cleanups
    this.documentStore.shutdown();

    this.channels.forEach((channel) => {
      this.messenger.unsubscribe(channel, this.process);
    });
  }

  process = async (event: ISubscriptionEvent<T>): Promise<void> => {
    switch (this.strategy) {
      case Strategy.DEDICATED_CHANNELS:
        return this.processForDedicatedChannels(event);
      case Strategy.DEFAULT:
        return this.processForDefault(event);
      case Strategy.LIMIT_SORT:
        return this.processLimitSort(event);
      default:
        throw new Error(`Could not identify`);
    }
  };

  async add(document) {
    if (!document) {
      return;
    }
    this.isDebug &&
      console.log(
        `[${this.collectionName}] Adding a new document: \n`,
        document
      );

    this.documentStore.add(document);
    for (const handler of this.handlers) {
      for (const callback of handler.addedCallbacks) {
        callback(document);
      }
    }
  }

  async update(documentId, set) {
    if (set === null) {
      return;
    }
    const oldDocument = Object.assign({}, this.documentStore.get(documentId));
    const optimalChangeSet = getChangedSet(oldDocument, set) as IChangeSet<T>;

    if (Object.keys(optimalChangeSet).length === 0) {
      // No change detected.
      return;
    }

    this.isDebug &&
      console.log(
        `[${this.collectionName}] Updating document ${documentId} with: \n`,
        optimalChangeSet
      );

    this.documentStore.update(documentId, optimalChangeSet);
    const document = this.documentStore.get(documentId);

    for (const handler of this.handlers) {
      for (const callback of handler.changedCallbacks) {
        callback(document, optimalChangeSet, oldDocument);
      }
    }
  }

  async remove(documentId) {
    this.isDebug &&
      console.log(`[${this.collectionName}] Removing document ${documentId}`);

    const document = this.documentStore.get(documentId);
    this.documentStore.remove(documentId);
    for (const handler of this.handlers) {
      for (const callback of handler.removedCallbacks) {
        callback(document);
      }
    }
  }

  /**
   * When the SubscriptionStore receives the request of a new subscription, it creates or re-uses a processor
   * and then it adds the handle to it. When doing this the first time we also have to add the documents that we already have in the store.
   * @param handler
   */
  public attachHandler(handler: SubscriptionHandler<any>) {
    this.handlers.push(handler);

    handler.addedCallbacks.forEach((callback) => {
      this.documentStore.all().forEach((document) => {
        callback(document);
      });
    });

    handler.markAsReady();
  }

  public detachHandler(handler) {
    this.handlers = this.handlers.filter((_handler) => _handler !== handler);
  }

  public hasHandlers() {
    return this.handlers.length > 0;
  }

  /**
   * Checks whether the document is eligible to be in this session
   * @param documentId
   */
  protected async isDocumentEligible(documentId): Promise<boolean> {
    if (this.filtersAreEmpty) {
      return true;
    }

    // TODO: refactor by matching filters properly using a mini mongo matcher
    const document = await this.collection.findOne(
      {
        ...this.filters,
        _id: documentId,
      },
      {
        projection: { _id: 1 },
      }
    );

    return Boolean(document);
  }

  /**
   * This retrieves the document for storage with propper field security
   * @param event
   * @param withSpecificFields
   */
  protected async getDocumentForStore(
    event: ISubscriptionEvent<T>,
    withSpecificFields: string[] = []
  ): Promise<null | Partial<T>> {
    const options: any = {};
    const filters = { _id: event.documentId };

    return this.collection.queryOne(this.getFilteredBody(filters));

    // TODO:
    // Optimise the solution in the following ways:
    // 1. Only send the changeset down the pipeline
    // 2. Only fetch related data through nova, if body contains a reducer or a link, then you fetch the right fields and nested data
    // as it most likely has been updated.

    if (withSpecificFields.length > 0) {
      const filteredFields = getAllowedFields(
        this.allowedFields,
        withSpecificFields
      );

      if (filteredFields.length === 0) {
        return null;
      }

      options.projection = {};
      filteredFields.forEach((field) => (options.projection[field] = 1));

      return this.collection.findOne(filters, options);
    } else {
      return this.collection.queryOne(this.getFilteredBody(filters));
    }
  }

  /**
   * This function returns the body but applies the filters you give it
   * This is useful when wanting to fetch a single document by id
   * @param filters
   */
  protected getFilteredBody(filters: any) {
    const body = Object.assign({}, this.body);
    body.$ = Object.assign({}, this.body.$);
    (body.$ as ICollectionQueryConfig).filters = {
      ...this.filters,
      ...filters,
    };

    return body;
  }

  protected async processLimitSort(event: ISubscriptionEvent<T>) {
    switch (event.mutationType) {
      case DocumentMutationType.INSERT:
        if (this.isDocumentEligible(event.documentId)) {
          this.requery(event);
        }
        break;
      case DocumentMutationType.UPDATE:
        if (this.documentStore.contains(event.documentId)) {
          if (this.isDocumentEligible(event.documentId)) {
            if (hasSortFields(this.options.sort, event.modifiedFields)) {
              this.requery(event);
            } else {
              this.update(
                event.documentId,
                await this.getDocumentForStore(event, event.modifiedFields)
              );
            }
          } else {
            this.requery(event);
          }
        } else {
          if (this.isDocumentEligible(event.documentId)) {
            this.requery(event);
          }
        }
        break;
      case DocumentMutationType.REMOVE:
        if (this.documentStore.contains(event.documentId)) {
          this.requery(event);
        } else {
          if (this.options.skip) {
            this.requery(event);
          }
        }
        break;
      default:
        throw new Error(`Invalid event specified: ${event}`);
    }
  }

  protected async processForDefault(event: ISubscriptionEvent<T>) {
    switch (event.mutationType) {
      case DocumentMutationType.INSERT:
        if (this.isDocumentEligible(event.documentId)) {
          // fetch the doc
          this.add(await this.getDocumentForStore(event));
        }
        break;
      case DocumentMutationType.UPDATE:
        if (this.isDocumentEligible(event.documentId)) {
          if (this.documentStore.contains(event.documentId)) {
            this.update(
              event.documentId,
              await this.getDocumentForStore(event, event.modifiedFields)
            );
          } else {
            this.add(
              await this.getDocumentForStore(event, event.modifiedFields)
            );
          }
        } else {
          if (this.documentStore.contains(event.documentId)) {
            this.remove(event.documentId);
          }
        }
        break;
      case DocumentMutationType.REMOVE:
        if (this.documentStore.contains(event.documentId)) {
          this.remove(event.documentId);
        }
        break;
      default:
        throw new Error(`Invalid event specified: ${event}`);
    }
  }

  protected async processForDedicatedChannels(event: ISubscriptionEvent<T>) {
    switch (event.mutationType) {
      case DocumentMutationType.INSERT:
        if (this.isDocumentEligible(event.documentId)) {
          // fetch the doc
          this.add(await this.getDocumentForStore(event));
        }
        break;
      case DocumentMutationType.UPDATE:
        if (this.documentStore.contains(event.documentId)) {
          this.update(
            event.documentId,
            await this.getDocumentForStore(event, event.modifiedFields)
          );
        }
        break;
      case DocumentMutationType.REMOVE:
        if (this.documentStore.contains(event.documentId)) {
          this.remove(event.documentId);
        }
        break;
      default:
        throw new Error(`Invalid event specified: ${event}`);
    }
  }

  protected async requery(event: ISubscriptionEvent<T>) {
    const freshIds = (
      await this.collection
        .find(this.filters, { ...this.options, fields: { _id: 1 } })
        .toArray()
    ).map((document) => document._id);

    const currentIds = this.documentStore.all().map((document) => document._id);
    // what new ids are in freshIds but not in currentIds
    const idsToAdd = freshIds.filter(
      (_id) => !DocumentStore.includes(currentIds, _id)
    );
    const idsToRemove = currentIds.filter(
      (_id) => !DocumentStore.includes(freshIds, _id)
    );

    if (idsToRemove.length > 0) {
      idsToRemove.forEach((_id) => this.remove(_id));
    }

    // if we have an update, and we have a newcommer, that new commer may be inside the ids
    // TODO: maybe refactor this in a separate action (?)
    if (
      DocumentMutationType.UPDATE === event.mutationType &&
      this.documentStore.contains(event.documentId)
    ) {
      this.update(
        event.documentId,
        await this.getDocumentForStore(event, event.modifiedFields)
      );
    }

    if (idsToAdd.length > 0) {
      const objectsToAdd = await this.collection.query(
        this.getFilteredBody({
          _id: {
            $in: idsToAdd,
          },
        })
      );

      objectsToAdd.forEach((doc) => {
        this.add(doc);
      });
    }
  }

  async reload() {
    const documents = await this.collection
      .find(this.filters, this.options)
      .toArray();

    for (const document of this.documentStore.all()) {
      await this.remove(document._id);
    }

    for (const document of documents) {
      await this.add(document);
    }
  }

  /**
   * @param selector
   * @param options
   * @returns {*}
   */
  protected getStrategy(filters, options) {
    if (options.limit && !options.sort) {
      options.sort = { _id: 1 };
      // throw new Meteor.Error(`Sorry, but you are not allowed to use "limit" without "sort" option.`);
    }

    if (options.limit && options.sort) {
      return Strategy.LIMIT_SORT;
    }

    if (filters._id) {
      return Strategy.DEDICATED_CHANNELS;
    }

    return Strategy.DEFAULT;
  }

  /**
   * Identifies to which channel should we subscribe
   */
  protected getSubscriptionChannels(filters): string[] {
    if (filters._id) {
      const _ids = extractIdsFromSelectors(filters);
      return _ids.map((_id) => {
        return `${this.collectionName}::${_id}`;
      });
    } else {
      return [this.collectionName];
    }
  }
}

export type SubscriptionProcessorOptionsType = {
  channels?: string[];
};
