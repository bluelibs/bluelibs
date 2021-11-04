import { Event } from "@bluelibs/core";
import {
  FilterQuery,
  UpdateQuery,
  UpdateWriteOpResult,
  DeleteWriteOpResultObject,
  FindAndModifyWriteOpResultObject,
  ClientSession,
  CollectionInsertOneOptions,
  UpdateOneOptions,
  CommonOptions,
} from "mongodb";
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
  options: CollectionInsertOneOptions;
}> {}

export class AfterInsertEvent<T = any> extends CollectionEvent<{
  document: T;
  _id: any;
  context: IExecutionContext;
  options: CollectionInsertOneOptions;
}> {}

export class BeforeUpdateEvent<T = any> extends CollectionEvent<{
  filter: FilterQuery<T>;
  update: UpdateQuery<T>;
  fields: IGetFieldsResponse;
  isMany: boolean;
  context: IExecutionContext;
  options: UpdateOneOptions;
}> {}

export class AfterUpdateEvent<T = any> extends CollectionEvent<{
  filter: FilterQuery<T>;
  update: UpdateQuery<T>;
  fields: IGetFieldsResponse;
  isMany: boolean;
  context: IExecutionContext;
  result: UpdateWriteOpResult | FindAndModifyWriteOpResultObject<any>;
  options: UpdateOneOptions;
}> {}

export class BeforeDeleteEvent<T = any> extends CollectionEvent<{
  filter: FilterQuery<T>;
  isMany: boolean;
  context: IExecutionContext;
  options: CommonOptions;
}> {}

export class AfterDeleteEvent<T = any> extends CollectionEvent<{
  filter: FilterQuery<T>;
  isMany: boolean;
  context: any;
  result: DeleteWriteOpResultObject | FindAndModifyWriteOpResultObject<any>;
  options: CommonOptions;
}> {}

/**
 * @deprecated Please use BeforeDeleteEvent
 */
export const BeforeRemoveEvent = BeforeDeleteEvent;
/**
 * @deprecated Please use AfterDeleteEvent
 */
export const AfterRemoveEvent = AfterDeleteEvent;
