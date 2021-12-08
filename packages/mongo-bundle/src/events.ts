import { Event } from "@bluelibs/core";
import * as MongoDB from "mongodb";
import { IExecutionContext, IGetFieldsResponse } from "./defs";
import { Collection } from "./models/Collection";

type CollectionEventData = {
  context: IExecutionContext;
};

export abstract class CollectionEvent<
  T extends CollectionEventData = any
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

export class BeforeInsertEvent<T = any> extends CollectionEvent<{
  document: T;
  context: IExecutionContext;
  options: MongoDB.InsertOneOptions;
}> {}

export class AfterInsertEvent<T = any> extends CollectionEvent<{
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
 * @deprecated Please use BeforeDeleteEvent
 */
export const BeforeRemoveEvent = BeforeDeleteEvent;
/**
 * @deprecated Please use AfterDeleteEvent
 */
export const AfterRemoveEvent = AfterDeleteEvent;
