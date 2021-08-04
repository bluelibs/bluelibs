import { FilterQuery } from "mongodb";

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
export interface IQueryOptions<T = any> {
  limit?: number;
  skip?: number;
  sort?:
    | Array<[string, number]>
    | {
        [key in keyof T]?: number | boolean;
      }
    | { [key: string]: number | boolean };
}

export interface ICollectionQueryConfig<T = any> {
  filters?: T extends null ? any : FilterQuery<T>;
  options?: IQueryOptions<T>;
  pipeline?: any[];
}

export type { FilterQuery as MongoFilterQuery };

/**
 * @deprecated The naming was meaningless. Please use ICollectionQueryConfig
 */
export interface IParameterableObject extends ICollectionQueryConfig {}

// The separation between body and sub body is the fact body doesn't have functionable $()
type BodyCustomise<T = null> = {
  $?: ICollectionQueryConfig<T>;
};

type SimpleFieldValue =
  | 1
  | number
  | boolean
  // This is the part where a reducer is involved and we pass params to it
  | {
      $: {
        [key: string]: any;
      };
    }
  // This is a type of projection operator
  | {
      $filter: any;
    };

type Unpacked<T> = T extends (infer U)[] ? U : T;

type AnyBody = {
  [key: string]: SimpleFieldValue | ICollectionQueryConfig | AnyBody;
};

type RootSpecificBody<T> = {
  [K in keyof T]?:
    | SimpleFieldValue
    // We do this because the type might be an array
    | QuerySubBodyType<Unpacked<T[K]>>;
};

export type QueryBodyType<T = null> = BodyCustomise<T> &
  (T extends null ? AnyBody : RootSpecificBody<T>);

export type QuerySubBodyType<T = null> = BodyCustomise<T> &
  (T extends null ? AnyBody : RootSpecificBody<T>);
