import { Constructor, ContainerInstance } from "@bluelibs/core";
import { IAstToQueryOptions } from "@bluelibs/nova";
import { type } from "os";
import { ClientOpts } from "redis";
import { ICacheManagerConfig } from "./cache/defs";
import { DocumentMutationType } from "./constants";
import { SubscriptionHandler } from "./models/SubscriptionHandler";
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
  cacheConfig: ICacheManagerConfig;
}

export type MessageHandleType = (data: any) => Promise<void>;

export interface IMessenger {
  subscribe(channel: string, handler: MessageHandleType);
  unsubscribe(channel: string, handler: MessageHandleType);
  publish(channels: string[], data);
}

export interface ISubscriptionEvent<T = any> {
  mutationType: DocumentMutationType;
  documentId: any;
  modifiedFields?: string[];
}

export interface ISubscriptionEventOptions {
  onAdded?: Function | Function[];
  onChanged?: Function | Function[];
  onRemoved?: Function | Function[];
}

export interface IDocumentStore {
  docs: any;
}

export interface IDocumentBase {
  _id: any;
}

export interface IChangeSet<T> {
  before: Partial<T>;
  now: Partial<T>;
}

export type OnDocumentAddedHandler = (document: any) => void | Promise<void>;

export type OnDocumentChangedHandler<T> = (
  document: any,
  changeSet: IChangeSet<T>,
  oldDocument: any
) => void | Promise<void>;

export type OnDocumentRemovedHandler = (document) => void | Promise<void>;

export interface ISubscriptionHandler<T> {
  onAdded(handler: OnDocumentAddedHandler);
  onChanged(handler: OnDocumentChangedHandler<T>);
  onRemoved(handler: OnDocumentRemovedHandler);
  onStop(handler: Function);
  stop(): Promise<void>;
}

declare module "@bluelibs/graphql-bundle" {
  export interface IGraphQLContext {
    container: ContainerInstance;
  }
}
