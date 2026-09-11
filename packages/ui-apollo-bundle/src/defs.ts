import { ApolloClientOptions } from "@apollo/client/core";

export interface IUIApolloBundleConfig {
  // The cache shape is user-defined and passed through to ApolloClient unchanged.
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
  onError?: (err: unknown) => void;
  onChanged?: (
    document: unknown,
    changeSet: unknown,
    previousDocument: unknown
  ) => void;
  onRemoved?: (document: unknown) => void;
  onAdded?: (document: unknown) => void;
}
