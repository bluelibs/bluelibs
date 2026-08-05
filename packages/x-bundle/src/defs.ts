export * from "./behaviors/defs";

import { Constructor, ContainerInstance } from "@bluelibs/core";
import { ClientOpts } from "redis";
import { ObjectID } from "@bluelibs/mongo-bundle";
import { UserId } from "@bluelibs/security-bundle";
import { ICacheManagerConfig } from "./cache/defs";
import { DocumentMutationType } from "./constants";

export type IDType = ObjectID | string;

export interface IXBundleConfig {
  /**
   * Application URL is useful as XBundle can be used to route to different part of your web/front-end application
   */
  appUrl: string;
  /**
   * The ROOT_URL is the url of the API itself.
   */
  rootUrl: string;
  /**
   * Feel free to customise your own logo using String.raw`{logo}`
   * You can generate your own here: http://patorjk.com/software/taag/
   */
  logo: string;
  live: {
    redis?: ClientOpts;
    debug?: boolean;
    messengerClass?: Constructor<IMessenger>;
  };
  //cache config
  cacheConfig?: ICacheManagerConfig;
}

export type MessageHandleType = (data: ISubscriptionEvent) => Promise<void>;

export interface IMessenger {
  subscribe(channel: string, handler: MessageHandleType);
  unsubscribe(channel: string, handler: MessageHandleType);
  publish(channels: string[], data: ISubscriptionEvent);
}

export interface ISubscriptionEvent<T extends IDocumentBase = IDocumentBase> {
  mutationType: DocumentMutationType;
  documentId: T["_id"];
  modifiedFields?: string[];
}

export type Callback = (...args: unknown[]) => void | Promise<void>;

export interface ISubscriptionEventOptions {
  onAdded?: Callback | Callback[];
  onChanged?: Callback | Callback[];
  onRemoved?: Callback | Callback[];
}

export interface IDocumentStore {
  docs: unknown;
}

export interface IDocumentBase {
  _id: IDType;
}

export interface IChangeSet<T> {
  before: Partial<T>;
  now: Partial<T>;
}

export type OnDocumentAddedHandler<T> = (document: T) => void | Promise<void>;

export type OnDocumentChangedHandler<T> = (
  document: T,
  changeSet: Partial<T>,
  oldDocument: T
) => void | Promise<void>;

export type OnDocumentRemovedHandler<T> = (document: T) => void | Promise<void>;

export interface ISubscriptionHandler<T> {
  onAdded(handler: OnDocumentAddedHandler<T>);
  onChanged(handler: OnDocumentChangedHandler<T>);
  onRemoved(handler: OnDocumentRemovedHandler<T>);
  onStop(handler: Callback);
  stop(): Promise<void>;
}

declare module "@bluelibs/graphql-bundle" {
  export interface IGraphQLContext {
    container: ContainerInstance;
    userId?: UserId;
    /**
     * The auth token for the current request, when the app is behind a
     * token-based auth layer (e.g. apollo-security-bundle).
     */
    authenticationToken?: string;
  }
}
