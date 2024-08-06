import * as MongoDB from "mongodb";
import {
  Inject,
  EventManager,
  Event,
  ContainerInstance,
  Service,
  IEventConstructor,
  Constructor,
  EventHandlerType,
  DeepPartial,
} from "@bluelibs/core";
import { DatabaseService } from "../services/DatabaseService";
import {
  BeforeInsertEvent,
  AfterInsertEvent,
  BeforeDeleteEvent,
  AfterDeleteEvent,
  BeforeUpdateEvent,
  AfterUpdateEvent,
  CollectionEvent,
} from "../events";
import {
  BehaviorType,
  IContextAware,
  IBundleLinkOptions,
  IExecutionContext,
} from "../defs";
import { ObjectId, toModel } from "@bluelibs/ejson";
import {
  DeepSyncDocumentNode,
  DeepSyncOptionsType,
} from "../services/deep-sync/DeepSyncDocumentNode";
import {
  query as queryNova,
  ILinkOptions,
  QueryBodyType,
  IReducerOptions,
  IExpanderOptions,
  addReducers,
  addExpanders,
  addLinks,
  IAstToQueryOptions,
  AnyifyFieldsWithIDs as Clean,
  LINK_STORAGE,
  Linker,
  IQueryContext,
} from "@bluelibs/nova";
import {
  DocumentWithID,
  ID,
  LinkOperatorModel,
  Unpacked,
} from "./LinkOperator";

/**
 * This symbol allows us to access this collection from the MongoCollection
 */
export const MONGO_BUNDLE_COLLECTION = Symbol("MONGO_BUNDLE_COLLECTION");
/**
 * This represents which ids have been deleted so we know how to do propper cascading
 */
const DELETED_IDS = Symbol("DELETED_IDS");
@Service()
export abstract class Collection<T extends MongoDB.Document = any> {
  static model: any;
  static links: IBundleLinkOptions = {};
  static reducers: IReducerOptions = {};
  static expanders: IExpanderOptions = {};
  static indexes: MongoDB.IndexDescription[] = [];
  static behaviors: BehaviorType[] = [];
  /**
   * This schema can be created by using { t } from @bluelibs/nova package t.schema({})
   */
  static jitSchema: any;

  static collectionName: string;

  public isInitialised: boolean = false;
  protected onInitFunctions: Function[] = [];
  public collection: MongoDB.Collection<T>;
  /**
   * Refers to the event manager that is only within this collection's context
   */
  public readonly localEventManager: EventManager;

  @Inject(() => EventManager)
  public readonly globalEventManager: EventManager;

  constructor(
    public readonly databaseService: DatabaseService,
    public readonly container: ContainerInstance
  ) {
    this.databaseService = databaseService;
    this.localEventManager = new EventManager();

    if (databaseService.isInitialised) {
      this.initialise();
    } else {
      // We do this to allow initialisation of collections before db connection was set
      databaseService.afterInit(() => {
        this.initialise();
      });
    }
  }

  get collectionName(): string {
    return this.collection.collectionName;
  }

  protected initialise() {
    // attach behaviors
    this.attachBehaviors();

    this.collection = this.databaseService.getMongoCollection(
      this.getStaticVariable("collectionName")
    ) as unknown as MongoDB.Collection<T>;

    this.collection[MONGO_BUNDLE_COLLECTION] = this;

    // Create the links, reducers, expanders
    this.initialiseNova();

    // ensure indexes
    const indexes = this.getStaticVariable("indexes");
    if (indexes.length) {
      this.collection.createIndexes(indexes);
    }

    this.isInitialised = true;
    this.onInitFunctions.forEach((fn) => fn());
  }

  /**
   * Find data using the MongoDB classic way.
   * @param filter
   * @param options
   */
  find(
    filter: MongoDB.Filter<Clean<T>> = {},
    options?: MongoDB.FindOptions<T extends T ? T : T>
  ): MongoDB.FindCursor<MongoDB.WithId<T>> {
    const cursor = this.collection.find(filter, options);

    const oldToArray = cursor.toArray.bind(cursor);
    cursor.toArray = async (...rest) => {
      const result = await oldToArray(...rest);
      return this.toModel(result);
    };

    return cursor;
  }

  /**
   * Count number of documents
   * @param filter
   * @param options
   * @returns
   */
  async countDocuments(
    filter: MongoDB.Filter<Clean<T>> = {},
    options?: MongoDB.CountOptions
  ): Promise<number> {
    return this.collection.countDocuments(filter, options);
  }

  /**
   * Count number of documents
   * @param filter
   * @param options
   * @returns
   */
  async count(
    filter: MongoDB.Filter<Clean<T>> = {},
    options?: MongoDB.CountOptions
  ): Promise<number> {
    return this.collection.countDocuments(filter, options);
  }

  /**
   * FindOne
   * @param query
   * @param options
   */
  async findOne(
    query: MongoDB.Filter<Clean<T>> = {},
    options?: MongoDB.FindOptions<T extends T ? T : T>
  ): Promise<T> {
    const result = await this.collection.findOne(query, options);

    return this.toModel(result);
  }

  /**
   * Inserts a single document inside the collection
   *
   * @param document
   * @param options
   */
  async insertOne(
    document: Partial<T>,
    options: IContextAware & MongoDB.InsertOneOptions = {}
  ): Promise<MongoDB.InsertOneResult<T>> {
    await this.setDefaults(document, options.context || {});

    if (options) {
      options.context = options.context || {};
    }

    const eventData = {
      document,
      context: options.context,
      options,
    };

    const event = new BeforeInsertEvent<any>(eventData);
    await this.emit(event);

    // We will insert what is left in the event
    const result = await this.collection.insertOne(
      event.data.document as any,
      options
    );

    await this.emit(
      new AfterInsertEvent({
        ...eventData,
        _id: result.insertedId,
      })
    );

    return result;
  }

  async insertMany(
    documents: Partial<T>[],
    options: IContextAware & MongoDB.InsertOneOptions = {}
  ): Promise<MongoDB.InsertManyResult<T>> {
    if (options) {
      options.context = options.context || {};
    }
    const events = [];

    for (const document of documents) {
      await this.setDefaults(document, options.context || {});

      events.push(
        new BeforeInsertEvent({
          document,
          context: options.context,
          options,
        })
      );
    }

    for (const event of events) {
      await this.emit(event);
    }

    const result = await this.collection.insertMany(
      events.map((e) => e.data.document),
      options
    );

    for (let i = 0; i < documents.length; i++) {
      await this.emit(
        new AfterInsertEvent({
          document: events[i].data.document,
          _id: result.insertedIds[i],
          context: options.context,
          options,
        })
      );
    }

    return result;
  }

  async updateOne(
    filters: MongoDB.Filter<Clean<T>>,
    update: MongoDB.UpdateFilter<Clean<T>>,
    options: IContextAware & MongoDB.UpdateOptions = {}
  ): Promise<MongoDB.UpdateResult> {
    if (options) {
      options.context = options.context || {};
    }
    const fields = this.databaseService.getFields(update);

    await this.emit(
      new BeforeUpdateEvent({
        filter: filters,
        update,
        fields,
        isMany: false,
        context: options.context,
        options,
      })
    );

    const result = await this.collection.updateOne(filters, update, options);

    await this.emit(
      new AfterUpdateEvent({
        filter: filters,
        update,
        fields,
        context: options.context,
        isMany: false,
        result,
        options,
      })
    );

    return result;
  }

  async updateMany(
    filters: MongoDB.Filter<Clean<T>>,
    update: MongoDB.UpdateFilter<Clean<T>>,
    options: IContextAware & MongoDB.UpdateOptions = {}
  ): Promise<MongoDB.UpdateResult> {
    if (options) {
      options.context = options.context || {};
    }

    const fields = this.databaseService.getFields(update);

    await this.emit(
      new BeforeUpdateEvent({
        filter: filters,
        update,
        fields,
        isMany: true,
        context: options.context,
        options,
      })
    );

    const result = await this.collection.updateMany(filters, update, options);

    await this.emit(
      new AfterUpdateEvent({
        filter: filters,
        update,
        fields,
        isMany: true,
        context: options.context,
        result: result as MongoDB.UpdateResult,
        options,
      })
    );

    return result as MongoDB.UpdateResult;
  }

  async deleteOne(
    filters: MongoDB.Filter<Clean<T>>,
    options: IContextAware & MongoDB.DeleteOptions = {}
  ): Promise<MongoDB.DeleteResult> {
    if (options) {
      options.context = options.context || {};
    }
    await this.emit(
      new BeforeDeleteEvent({
        filter: filters,
        isMany: false,
        context: options.context,
        options,
      })
    );

    const result = await this.collection.deleteOne(filters, options);

    await this.emit(
      new AfterDeleteEvent({
        filter: filters,
        isMany: false,
        context: options.context,
        result,
        options,
      })
    );

    return result;
  }

  /**
   * @param filters
   * @param options
   */
  async deleteMany(
    filters: MongoDB.Filter<Clean<T>>,
    options: IContextAware & MongoDB.DeleteOptions = {}
  ): Promise<MongoDB.DeleteResult> {
    if (options) {
      options.context = options.context || {};
    }

    await this.emit(
      new BeforeDeleteEvent({
        filter: filters,
        isMany: true,
        context: options.context,
        options,
      })
    );

    const result = await this.collection.deleteMany(filters, options);

    await this.emit(
      new AfterDeleteEvent({
        filter: filters,
        context: options.context,
        isMany: true,
        result,
        options,
      })
    );

    return result;
  }

  async findOneAndDelete(
    filters: MongoDB.Filter<Clean<T>> = {},
    options: IContextAware & MongoDB.FindOneAndDeleteOptions = {}
  ): Promise<MongoDB.ModifyResult<T>> {
    if (options) {
      options.context = options.context || {};
    }

    await this.emit(
      new BeforeDeleteEvent({
        context: options?.context || {},
        filter: filters,
        isMany: false,
        options,
      })
    );

    const result = await this.collection.findOneAndDelete(filters, 
      {
        ...options,
        includeResultMetadata: true,
      }
    );

    await this.emit(
      new AfterDeleteEvent({
        context: options?.context || {},
        filter: filters,
        isMany: false,
        result: result as unknown as MongoDB.ModifyResult<T>,
        options,
      })
    );

    if (result.value) {
      result.value = this.toModel(result.value);
    }

    return result;
  }

  async findOneAndUpdate(
    filters: MongoDB.Filter<Clean<T>> = {},
    update: MongoDB.UpdateFilter<Clean<T>>,
    options: IContextAware & MongoDB.FindOneAndUpdateOptions = {}
  ): Promise<MongoDB.ModifyResult<T>> {
    if (options) {
      options.context = options.context || {};
    }
    const fields = this.databaseService.getFields(update);

    await this.emit(
      new BeforeUpdateEvent({
        filter: filters,
        update,
        fields,
        isMany: false,
        context: options.context,
        options,
      })
    );

    const result = await this.collection.findOneAndUpdate(
      filters,
      update,
      {
        ...options,
        includeResultMetadata: true,
      }
    );

    await this.emit(
      new AfterUpdateEvent({
        filter: filters,
        update,
        fields,
        context: options.context,
        isMany: false,
        result,
        options,
      })
    );

    if (result.value) {
      result.value = this.toModel(result.value);
    }

    return result;
  }

  /**
   * @param pipeline Pipeline options from mongodb
   * @param options
   */
  aggregate(pipeline: any[], options?: MongoDB.AggregateOptions) {
    return this.collection.aggregate(pipeline, options);
  }

  /**
   * Queries the classes and transforms them to object of the model if it exists
   *§
   * @param request
   */
  async query(
    request: QueryBodyType<T>,
    session?: MongoDB.ClientSession,
    context?: Partial<IQueryContext>
  ): Promise<Array<Partial<T>>> {
    const results = await queryNova(this.collection, request, {
      ...context,
      container: this.container,
      session,
    }).fetch();

    return this.toModel(results);
  }

  /**
   * Queries the classes and transforms them to object of the model if it exists
   *
   * @param request
   */
  async queryOne(
    request: QueryBodyType<T>,
    session?: MongoDB.ClientSession,
    context?: Partial<IQueryContext>
  ): Promise<Partial<T>> {
    const result = await queryNova(this.collection, request, {
      ...context,
      session,
      container: this.container,
    }).fetchOne();

    return this.toModel(result);
  }

  /**
   * Retrieve the collection from the database service
   * @param collectionBaseClass The collection class
   */
  getCollection(collectionBaseClass): Collection<any> {
    return this.databaseService.getCollection(collectionBaseClass);
  }

  /**
   * This helper method returns the static variable defined
   * We lose strong typing, but we avoid (this.constructor as typeof Collection)[variable] usage
   *
   * @param variable
   */
  public getStaticVariable<T extends keyof typeof Collection>(variable: T) {
    return (this.constructor as typeof Collection)[variable];
  }

  /**
   * This runs the behavior attachment process
   */
  protected attachBehaviors() {
    const behaviors = this.getStaticVariable("behaviors");

    behaviors.forEach((behavior) => {
      behavior(this);
    });
  }

  protected initialiseNova() {
    const links: IBundleLinkOptions = this.getStaticVariable("links") || {};
    const adaptedLinks: ILinkOptions = {};

    for (const key in links) {
      const collectionBaseClassResolver = links[key].collection;

      adaptedLinks[key] = {
        ...links[key],
        collection: () =>
          this.getCollection(collectionBaseClassResolver(this.container))
            .collection,
      };
    }

    // blend with nova links, reducers, expanders
    addLinks(this.collection, adaptedLinks);
    addReducers(this.collection, this.getStaticVariable("reducers") || {});
    addExpanders(this.collection, this.getStaticVariable("expanders") || {});
  }

  /**
   * Listen to events on this collection, shorthand for localEventManager
   *
   * @param collectionEvent This is the class of the event
   * @param handler This is the function that is executed
   */
  on<K>(collectionEvent: IEventConstructor<K>, handler: EventHandlerType<K>) {
    this.localEventManager.addListener(collectionEvent, handler);
  }

  /**
   * Transforms a plain object to the model
   * @param plain Object which you want to transform
   */
  toModel(plain: any | any[]): any | any[] {
    const model = this.getStaticVariable("model");

    if (model) {
      if (Array.isArray(plain)) {
        return plain.map((element) => toModel<any>(model, element));
      }

      return toModel(model, plain);
    }

    return plain;
  }

  /**
   * Override this method to set defaults for insertion.
   * @param plain
   */
  async setDefaults(plain: Partial<T>, context?: IExecutionContext) {}

  /**
   * Perform a query directly from GraphQL resolver based on requested fields. Returns an array.
   *
   * @param ast
   * @param config
   */
  async queryGraphQL<T = null>(
    ast: any,
    config?: IAstToQueryOptions<T>,
    session?: MongoDB.ClientSession,
    context?: Partial<IQueryContext>
  ): Promise<Array<Partial<T>>> {
    const result = await queryNova
      .graphql(this.collection, ast, config, {
        ...context,
        container: this.container,
        session,
      })
      .fetch();

    return this.toModel(result);
  }

  /**
   * Perform a query directly from GraphQL resolver based on requested fields. Returns a single object.
   * @param ast
   * @param config
   */
  async queryOneGraphQL<T = null>(
    ast,
    config?: IAstToQueryOptions<T>,
    session?: MongoDB.ClientSession,
    context?: Partial<IQueryContext>
  ): Promise<Partial<T>> {
    const result = await queryNova
      .graphql(this.collection, ast, config, {
        ...context,
        container: this.container,
        session,
      })
      .fetchOne();

    return this.toModel(result);
  }

  /**
   * Emit events
   * @param event
   */
  async emit(event: CollectionEvent<any>) {
    event.prepare(this);
    await this.localEventManager.emit(event);
    await this.globalEventManager.emit(event);
  }

  /**
   * TODO: transactions fix
   * Transaction-based deep synchronisation syncing.
   *
   * @param object
   * @param options
   * @returns
   */
  async deepSync(
    object: DeepPartial<T> | DeepPartial<T>[],
    options: IContextAware &
      (MongoDB.InsertOneOptions | MongoDB.UpdateOptions) = {},
    deepSyncOptions: DeepSyncOptionsType = {}
  ): Promise<void> {
    const objects = Array.isArray(object) ? object : [object];

    for (const object of objects) {
      const node = new DeepSyncDocumentNode(
        this.collection,
        object,
        deepSyncOptions
      );

      await node.flush({
        ...options,
      });
    }
  }

  getLinkOperator<K extends DocumentWithID = null, Q extends keyof T = keyof T>(
    linkName: T extends null ? string : Q
  ): LinkOperatorModel<T extends null ? K : Unpacked<T[Q]>> {
    return new LinkOperatorModel(this, linkName as string);
  }

  onInit(fn: Function) {
    if (this.isInitialised) {
      fn();
    } else {
      this.onInitFunctions.push(fn);
    }
  }
}
