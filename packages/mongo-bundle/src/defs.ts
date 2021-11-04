import { Collection } from "./models/Collection";
import {
  IAstToQueryOptions,
  ILinkCollectionOptions,
  QueryBodyType,
} from "@bluelibs/nova";
import { IValidateOptions } from "@bluelibs/validator-bundle";
import { ContainerInstance, Constructor } from "@bluelibs/core";
import { ClientSession } from "mongodb";

export type BehaviorType = (collectionEventManager: Collection<any>) => void;

declare module "@bluelibs/nova" {
  export interface IQueryContext {
    container: ContainerInstance;
  }
}

/**
 * This represents the mutation execution context, where we can store valuable info.
 * "context" is passed inside the "options" arguments of every mutation.
 */
export interface IExecutionContext {
  /**
   * This userId is needed for blamable behaviors. You can omit it if it's done by the system
   */
  userId?: any;
  /**
   * Used for transactions
   */
  session?: ClientSession;
}

export interface IContextAware {
  context?: IExecutionContext;
}

export interface ITimestampableBehaviorOptions {
  fields?: {
    createdAt?: string;
    updatedAt?: string;
  };
}

export interface IValidateBehaviorOptions {
  model: any;
  options?: Omit<IValidateOptions, "model">;
  cast?: boolean;
  castOptions?: any;
}

export interface IBlameableBehaviorOptions {
  fields?: {
    updatedBy?: string;
    createdBy?: string;
  };
  /**
   * Enabling this will check if `userId` is not undefined, if it is it will throw an error, userId can still be `null` because the system does the operation (in a cronjob for example)
   * You can regard it as a safety net to avoid mistakes.
   */
  throwErrorWhenMissing?: boolean;
}

export interface ISoftdeletableBehaviorOptions {
  fields?: {
    isDeleted?: string;
    deletedAt?: string;
    deletedBy?: string;
  };
}

export interface IBundleLinkCollectionOption
  extends Omit<ILinkCollectionOptions, "collection"> {
  collection: (container: ContainerInstance) => Constructor<Collection>;
}

export interface IBundleLinkOptions {
  [key: string]: IBundleLinkCollectionOption;
}

export interface IGetFieldsResponse {
  all: string[];
  top: string[];
}
