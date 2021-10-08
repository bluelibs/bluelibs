import { Event } from "@bluelibs/core";
import {
  FilterQuery,
  UpdateQuery,
  UpdateWriteOpResult,
  DeleteWriteOpResultObject,
} from "mongodb";
import { IExecutionContext, IGetFieldsResponse } from "./defs";
import { Collection } from "./models/Collection";
import { FindAndModifyWriteOpResultObject } from "mongodb";

export abstract class CollectionEvent<
  T extends { context: IExecutionContext } = any
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
}> {}

export class AfterInsertEvent<T = any> extends CollectionEvent<{
  document: T;
  _id: any;
  context: IExecutionContext;
}> {}

export class BeforeUpdateEvent<T = any> extends CollectionEvent<{
  filter: FilterQuery<T>;
  update: UpdateQuery<T>;
  fields: IGetFieldsResponse;
  isMany: boolean;
  context: IExecutionContext;
}> {}

export class AfterUpdateEvent<T = any> extends CollectionEvent<{
  filter: FilterQuery<T>;
  update: UpdateQuery<T>;
  fields: IGetFieldsResponse;
  isMany: boolean;
  context: IExecutionContext;
  result: UpdateWriteOpResult | FindAndModifyWriteOpResultObject<any>;
}> {}

export class BeforeDeleteEvent<T = any> extends CollectionEvent<{
  filter: FilterQuery<T>;
  isMany: boolean;
  context: IExecutionContext;
}> {}

export class AfterDeleteEvent<T = any> extends CollectionEvent<{
  filter: FilterQuery<T>;
  isMany: boolean;
  context: any;
  result: DeleteWriteOpResultObject | FindAndModifyWriteOpResultObject<any>;
}> {}

/**
 * @deprecated Please use BeforeDeleteEvent
 */
export const BeforeRemoveEvent = BeforeDeleteEvent;
/**
 * @deprecated Please use AfterDeleteEvent
 */
export const AfterRemoveEvent = AfterDeleteEvent;
