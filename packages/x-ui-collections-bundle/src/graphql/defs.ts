import { IEventsMap } from "@bluelibs/ui-apollo-bundle";

type Filter<_T = unknown> = {
  [key: string]: unknown;
};

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
  filters?: Filter<T>;
  options?: IQueryOptions<T>;
  pipeline?: unknown[];
}

export type { Filter as MongoFilterQuery };

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
        [key: string]: unknown;
      };
    }
  // This is a type of projection operator
  | {
      $filter: unknown;
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

export interface IQueryInput<T = null> {
  /**
   * MongoDB Filters
   * @url https://docs.mongodb.com/manual/reference/operator/query/
   */
  filters?: Filter<T>;
  /**
   * MongoDB Options
   */
  options?: IQueryOptionsInput;
}

export interface ISubscriptionOptions extends IEventsMap {
  subscription?: string;
}

export interface IQueryOptionsInput {
  sort?: IQueryOptions["sort"];
  limit?: number;
  skip?: number;
  sideBody?: QueryBodyType;
}
