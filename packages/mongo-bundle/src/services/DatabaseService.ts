import { Inject, ContainerInstance, Service } from "@bluelibs/core";
import {
  MongoClient,
  Db,
  Collection as MongoCollection,
  UpdateFilter as UpdateQuery,
  TransactionOptions,
  ClientSession,
} from "mongodb";
import { MONGO_CONNECTION_OPTIONS, MONGO_URL } from "../constants";
import { Collection } from "../models/Collection";
import { IGetFieldsResponse } from "../defs";
import { LoggerService } from "@bluelibs/logger-bundle";

@Service()
export class DatabaseService {
  public readonly client: MongoClient;
  protected afterInitQueue = [];
  protected _db: Db;

  constructor(
    @Inject(MONGO_URL) protected readonly mongoUrl,
    @Inject(MONGO_CONNECTION_OPTIONS) protected readonly mongoConnectionOptions,
    protected readonly logger: LoggerService,
    protected readonly container: ContainerInstance
  ) {
    this.client = new MongoClient(mongoUrl, {
      ...mongoConnectionOptions,
    });
  }

  async init() {
    this.logger.info(`Connecting to MongoDB database...`);
    try {
      await this.client.connect();
    } catch (e) {
      this.logger.error(
        `An error occurred while connecting to the database: ${e.toString()}`
      );
      throw e;
    }
    this.logger.info(`Connected to the database.`);
    this._db = this.client.db();
    this.afterInitQueue.forEach((fn) => fn());
  }

  /**
   * This is how you retrieve the real collection
   */
  getMongoCollection(name: string): MongoCollection {
    if (!name) {
      throw new Error(
        "Please provide a name for the collection. Did you forget to specify 'static collectionName' in the Collection class?"
      );
    }
    if (!this._db) {
      throw new Error(
        `You're trying to use the collection "${name}" but connection to MongoDB hasn't been established yet.`
      );
    }
    return this._db.collection(name);
  }

  /**
   * Knows whether its initialised or not.
   */
  get isInitialised(): boolean {
    return Boolean(this._db);
  }

  /**
   * This allows us to set the database properly
   * @param fn
   */
  afterInit(fn: Function) {
    if (!this.isInitialised) {
      this.afterInitQueue.push(fn);
    } else {
      fn();
    }
  }

  /**
   * Gives you access to the database connection handler
   */
  get db(): Db {
    return this._db;
  }

  /**
   * Retrieve the collection from the database service
   * @param collectionBaseClass The collection class
   */
  getCollection(collectionBaseClass): Collection<any> {
    return this.container.get<Collection<any>>(collectionBaseClass);
  }

  /**
   * In order to transact
   *
   * @param fn
   * @param options
   */
  async transact(
    fn: (session: ClientSession) => Promise<void>,
    options: TransactionOptions = {}
  ) {
    // Step 1: Start a Client Session
    const session = this.client.startSession();

    // Step 2: Optional. Define options to use for the transaction
    const transactionOptions = Object.assign(
      {
        readPreference: "primary",
        readConcern: { level: "local" },
        writeConcern: { w: "majority" },
      },
      options
    );

    try {
      await session.withTransaction(async () => {
        try {
          const result = await fn(session);
        } catch (e) {
          await session.abortTransaction();
          throw e;
        }
      }, transactionOptions);
    } finally {
      await session.endSession();
    }
  }

  /**
   * @param mutator
   */
  getFields(update: UpdateQuery<any>): IGetFieldsResponse {
    // compute modified fields
    var fields = [];
    var topLevelFields = [];

    for (const op in update) {
      const param = update[op];
      if (op[0] == "$") {
        const keys = Object.keys(param);
        for (const i in keys) {
          const field = keys[i];

          // record the field we are trying to change
          if (!fields.includes(field)) {
            // fields.push(field);
            // topLevelFields.push(field.split('.')[0]);
            // like { $set: { 'array.1.xx' } }
            const specificPositionFieldMatch = /\.[\d]+(\.)?/.exec(field);
            if (specificPositionFieldMatch) {
              fields.push(field.slice(0, specificPositionFieldMatch.index));
            } else {
              if (field.indexOf(".$") !== -1) {
                if (field.indexOf(".$.") !== -1) {
                  fields.push(field.split(".$.")[0]);
                } else {
                  fields.push(field.split(".$")[0]);
                }
              } else {
                fields.push(field);
              }
            }

            topLevelFields.push(field.split(".")[0]);
          }
        }
      } else {
        fields.push(op);
      }
    }

    return { all: fields, top: topLevelFields };
  }
}
