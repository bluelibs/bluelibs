import { Collection } from "./models/Collection";
import { ILinkCollectionOptions } from "@bluelibs/nova";
import { IValidateOptions } from "@bluelibs/validator-bundle";
import { ContainerInstance, Constructor } from "@bluelibs/core";
import { ObjectId } from "@bluelibs/ejson";
import * as MongoDB from "mongodb";

/**
 * A behavior receives a collection instance of any document type and wires itself onto it.
 * Behaviors are deliberately non-generic: a behavior written for a concrete document type
 * (e.g. `(collection: Collection<MyDoc>) => void`) must remain assignable regardless of the
 * collection it is attached to. A generic signature would require `Collection<T>` to be
 * assignable to `Collection<MyDoc>` for every `T`, which the invariant driver types forbid.
 */
export type BehaviorType = (collectionEventManager: Collection<any>) => void;

/**
 * The identifier of the user performing an operation. This must stay mutually assignable
 * with security-bundle's `UserId` (`number | string | ObjectId | Partial<ObjectId>`), since
 * consumers pass security-bundle user ids into mongo-bundle operations.
 */
export type UserId = number | string | ObjectId | Partial<ObjectId>;

declare module "@bluelibs/nova" {
  export interface IQueryContext {
    container?: ContainerInstance;
    locale?: string;
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
  userId?: UserId;
  /**
   * Used for transactions
   */
  session?: MongoDB.ClientSession;
  /**
   * Used for i18n
   */
  locale?: string;
}

export interface IContextAware {
  context?: IExecutionContext;
}

export interface ITranslatableBehaviorOptions {
  /**
   * Specify the top level fields that you want to be translatable
   */
  fields: string[];
  locales: string[];
  defaultLocale: string;
}

export type I18NType<T = string> = Array<{
  locale: string;
  value: T;
}>;

export interface ITimestampableBehaviorOptions {
  fields?: {
    createdAt?: string;
    updatedAt?: string;
  };
  /**
   * If this is set to `true`, on insertion updatedAt will be null instead, otherwise it will be kept as the creation date
   */
  keepInitialUpdateAsNull?: boolean;
}

export interface IValidateBehaviorOptions {
  model: Constructor<unknown>;
  options?: Omit<IValidateOptions, "model">;
  cast?: boolean;
  castOptions?: Partial<IValidateOptions>;
}

export interface IBlameableBehaviorOptions {
  fields?: {
    updatedBy?: string;
    createdBy?: string;
  };
  /**
   * If this is set to `true`, on insertion updatedBy will be null instead, otherwise it will be kept as the createdBy id
   */
  keepInitialUpdateAsNull?: boolean;
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

export interface IBundleLinkCollectionOption<T = unknown> extends Omit<
  ILinkCollectionOptions,
  "collection"
> {
  collection: (container: ContainerInstance) => Constructor<T>;
  /**
   * If you want to delete this relationship when this gets deleted, cleaning can only be used for reversed relationships.
   */
  // onDelete?: "CASCADE" | "CLEAN";
}

export interface IBundleLinkOptions {
  [key: string]: IBundleLinkCollectionOption;
}

export interface IGetFieldsResponse {
  all: string[];
  top: string[];
}
