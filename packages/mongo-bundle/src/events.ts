import { Event } from "@bluelibs/core";
import * as MongoDB from "mongodb";
import { IExecutionContext, IGetFieldsResponse } from "./defs";
import { Collection } from "./models/Collection";

type CollectionEventData = {
  context: IExecutionContext;
};

export abstract class CollectionEvent<
  T extends CollectionEventData = CollectionEventData
> extends Event<T> {
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

export class BeforeInsertEvent<T = Object> extends CollectionEvent<{
  document: T;
  context: IExecutionContext;
  options: MongoDB.InsertOneOptions;
}> {}

export class AfterInsertEvent<T = Object> extends CollectionEvent<{
  document: T;
  _id: any;
  context: IExecutionContext;
  options: MongoDB.InsertOneOptions;
}> {}

export class BeforeUpdateEvent<T = any> extends CollectionEvent<{
  filter: MongoDB.Filter<T>;
  update: MongoDB.UpdateFilter<T>;
  fields: IGetFieldsResponse;
  isMany: boolean;
  context: IExecutionContext;
  options: MongoDB.UpdateOptions;
}> {}

export class AfterUpdateEvent<T = any> extends CollectionEvent<{
  filter: MongoDB.Filter<T>;
  update: MongoDB.UpdateFilter<T>;
  fields: IGetFieldsResponse;
  isMany: boolean;
  context: IExecutionContext;
  result: MongoDB.UpdateResult | MongoDB.ModifyResult<T>;
  options: MongoDB.UpdateOptions;
}> {}

export class BeforeDeleteEvent<T = any> extends CollectionEvent<{
  filter: MongoDB.Filter<T>;
  isMany: boolean;
  context: IExecutionContext;
  options: MongoDB.DeleteOptions | MongoDB.FindOneAndDeleteOptions;
}> {}

export class AfterDeleteEvent<T = any> extends CollectionEvent<{
  filter: MongoDB.Filter<T>;
  isMany: boolean;
  context: any;
  result: MongoDB.DeleteResult | MongoDB.ModifyResult<T>;
  options: MongoDB.DeleteOptions | MongoDB.FindOneAndDeleteOptions;
}> {}

/**
 * Before a find operation is executed we await changes to the filters. Translation is a good use-case for this.
 */
export class BeforeQueryLocalEvent<T = any> extends CollectionEvent<{
  filter: MongoDB.Filter<T>;
  context: IExecutionContext;
  method: "findOne" | "find" | "count";
}> {}
/**
 * Before a nova operation is executed we await changes to the filters. Translation is a good use-case for this.
 */
export class BeforeNovaQueryLocalEvent<T = any> extends CollectionEvent<{
  filter: MongoDB.Filter<T>;
  context: IExecutionContext;
  method: "findOne" | "find" | "count";
}> {}

/**
 * This event is done before we transform the data to the default model.
 */
export class BeforeToModelLocalEvent<T = any> extends CollectionEvent<{
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
