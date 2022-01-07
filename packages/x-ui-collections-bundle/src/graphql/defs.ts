import { IEventsMap } from "@bluelibs/ui-apollo-bundle";

type Filter<T = any> = {
  [key: string]: any;
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
  filters?: T extends null ? any : Filter<T>;
  options?: IQueryOptions<T>;
  pipeline?: any[];
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

export interface IQueryInput<T = null> {
  /**
   * MongoDB Filters
   * @url https://docs.mongodb.com/manual/reference/operator/query/
   */
  filters?: T extends null
    ? {
        [key: string]: any;
      }
    : Filter<T>;
  /**
   * MongoDB Options
   */
  options?: IQueryOptionsInput;
}

export interface ISubscriptionOptions extends IEventsMap {
  subscription?: string;
}

export interface IQueryOptionsInput {
  sort?: {
    [key: string]: any;
  };
  limit?: number;
  skip?: number;
  sideBody?: QueryBodyType;
}
