import { ApolloClientOptions } from "@apollo/client/core";

export interface IUIApolloBundleConfig {
  client: ApolloClientOptions<any>;
  enableSubscriptions?: boolean;
}

export enum SubscriptionEvents {
  ADDED = "added",
  CHANGED = "changed",
  REMOVED = "removed",
  READY = "ready",
}

export interface ISubscriptionEventMessage {
  event: SubscriptionEvents;
  document: string;
}

export interface IEventsMap {
  onReady?: () => void;
  onError?: (err: any) => void;
  onChanged?: (document: any, changeSet: any, previousDocument: any) => void;
  onRemoved?: (document: any) => void;
  onAdded?: (document: any) => void;
}
