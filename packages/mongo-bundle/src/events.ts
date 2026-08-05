import { Event } from "@bluelibs/core";
import * as MongoDB from "mongodb";
import { IExecutionContext, IGetFieldsResponse } from "./defs";
import { Collection } from "./models/Collection";

type CollectionEventData = {
  context: IExecutionContext;
};

export abstract class CollectionEvent<
  T extends CollectionEventData = CollectionEventData,
> extends Event<T> {
  // why: an event can be emitted by any concrete Collection subclass; consumers
  // narrow with `event.collection instanceof ConcreteCollection`, and a generic
  // collection type would not be assignable across document types.
  protected _collection: Collection<any>;

  get collection(): Collection<any> {
    return this._collection;
  }

  prepare(collection: Collection<any>) {
    this._collection = collection;
    if (!this.data.context) {
      this.data.context = {};
    }
  }
}

export class BeforeInsertEvent<T = MongoDB.Document> extends CollectionEvent<{
  document: T;
  context: IExecutionContext;
  options: MongoDB.InsertOneOptions;
}> {}

export class AfterInsertEvent<T = MongoDB.Document> extends CollectionEvent<{
  document: T;
  // why: the id type is derived from the collection schema at runtime; for a
  // bare event (T = Document) it is not statically known.
  _id: unknown;
  context: IExecutionContext;
  options: MongoDB.InsertOneOptions;
}> {}

export class BeforeUpdateEvent<T = MongoDB.Document> extends CollectionEvent<{
  filter: MongoDB.Filter<T>;
  update: MongoDB.UpdateFilter<T>;
  fields: IGetFieldsResponse;
  isMany: boolean;
  context: IExecutionContext;
  options: MongoDB.UpdateOptions;
}> {}

export class AfterUpdateEvent<T = MongoDB.Document> extends CollectionEvent<{
  filter: MongoDB.Filter<T>;
  update: MongoDB.UpdateFilter<T>;
  fields: IGetFieldsResponse;
  isMany: boolean;
  context: IExecutionContext;
  result: MongoDB.UpdateResult | MongoDB.ModifyResult<T>;
  options: MongoDB.UpdateOptions;
}> {}

export class BeforeDeleteEvent<T = MongoDB.Document> extends CollectionEvent<{
  filter: MongoDB.Filter<T>;
  isMany: boolean;
  context: IExecutionContext;
  options: MongoDB.DeleteOptions | MongoDB.FindOneAndDeleteOptions;
}> {}

export class AfterDeleteEvent<T = MongoDB.Document> extends CollectionEvent<{
  filter: MongoDB.Filter<T>;
  isMany: boolean;
  // why: mutation contexts are extended by consumers with arbitrary fields
  // (e.g. x-bundle stores live-sync metadata under a symbol key).
  context: any;
  result: MongoDB.DeleteResult | MongoDB.ModifyResult<T>;
  options: MongoDB.DeleteOptions | MongoDB.FindOneAndDeleteOptions;
}> {}

/**
 * Before a find operation is executed we await changes to the filters. Translation is a good use-case for this.
 */
export class BeforeQueryLocalEvent<
  T = MongoDB.Document,
> extends CollectionEvent<{
  filter: MongoDB.Filter<T>;
  context: IExecutionContext;
  method: "findOne" | "find" | "count";
}> {}
/**
 * Before a nova operation is executed we await changes to the filters. Translation is a good use-case for this.
 */
export class BeforeNovaQueryLocalEvent<
  T = MongoDB.Document,
> extends CollectionEvent<{
  filter: MongoDB.Filter<T>;
  context: IExecutionContext;
  method: "findOne" | "find" | "count";
}> {}

/**
 * This event is done before we transform the data to the default model.
 */
export class BeforeToModelLocalEvent<
  T = MongoDB.Document,
> extends CollectionEvent<{
  filter: MongoDB.Filter<T>;
  context: IExecutionContext;
}> {}

/**
 * @deprecated Please use BeforeDeleteEvent
 */
export const BeforeRemoveEvent = BeforeDeleteEvent;
/**
 * @deprecated Please use AfterDeleteEvent
 */
export const AfterRemoveEvent = AfterDeleteEvent;
