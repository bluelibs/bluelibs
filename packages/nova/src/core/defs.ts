import { ClientSession, Collection } from "mongodb";
import { Filter as FilterQuery } from "mongodb";

export interface IToArrayable {
  toArray(): Promise<any[]>;
}

export interface IQueryContext {
  session?: ClientSession;
  // Do be extended by others
}

export interface ISecureOptions<T = null> {
  intersect?: QueryBodyType<T>;
  maxLimit?: number;
  maxDepth?: number;
  deny?: string[];
  /**
   * Enforce filters
   */
  filters?: T extends null
    ? FilterQuery<any>
    : FilterQuery<AnyifyFieldsWithIDs<T>>;
  options?: any;
  /**
   * This gets deeply merged with the body (useful for $ argument)
   */
  sideBody?: QueryBodyType<T>;
}

export interface IAstToQueryOptions<T = null> extends ISecureOptions<T> {
  embody?(body: QueryBodyType<T>, getArguments: (path: string) => any);
}

export interface IStorageData {
  links: ILinkOptions;
  reducers: IReducerOptions;
  expanders: IExpanderOptions;
}

export interface IFindOptions {
  [key: string]: any;
}

/**
 * We are now using the MongoCollection as our reference.
 * @deprecated
 */
export interface ICollection {
  aggregate: any;
  collectionName: any;
}

export type HardwiredFiltersOptions = {
  filters?: FilterQuery<any>;
};
export interface ILinkCollectionOptions {
  collection: () => Collection<any>;
  field?: string;
  foreignField?: string;
  unique?: boolean;
  many?: boolean;
  /**
   * Applicable only when the link is on the other side
   */
  inversedBy?: string;
  index?: boolean;
  filters?:
    | FilterQuery<any>
    | ((options: HardwiredFiltersOptions) => FilterQuery<any>);
}

type AnyObject = { [key: string]: any };
export interface IReducerOption<
  ReturnType = any,
  ParamsType = AnyObject,
  ParentType = any
> {
  dependency: DeepOmit<QueryBodyType, "$">;
  pipeline?: any[];
  projection?: any;
  reduce?: (
    object: ParentType,
    params?: { context: IQueryContext } & ParamsType
  ) => ReturnType | Promise<ReturnType>;
}

export interface ILinkOptions {
  [key: string]: ILinkCollectionOptions;
}

export interface IReducerOptions {
  [key: string]: IReducerOption;
}

export interface IExpanderOptions {
  [key: string]: QueryBodyType;
}

export interface IFieldMapOptions {
  [key: string]: string;
}

export type ValueOrValueResolver<T> = T | ((...args: any[]) => T);

/**
 * @deprecated Use QueryBody type instead to ensure type safety.
 */
export interface IQueryBody {
  $?: ValueOrValueResolver<ICollectionQueryConfig>;
  $alias?: string;
  [field: string]:
    | string
    | number
    | IQueryBody
    | ICollectionQueryConfig
    | ValueOrValueResolver<ICollectionQueryConfig>;
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
  filters?: T extends null
    ? FilterQuery<any>
    : FilterQuery<AnyifyFieldsWithIDs<T>>;
  options?: IQueryOptions<T>;
  pipeline?: any[];
}

/**
 * @deprecated The naming was meaningless. Please use ICollectionQueryConfig
 */
export interface IParameterableObject extends ICollectionQueryConfig {}

// The separation between body and sub body is the fact body doesn't have functionable $()
type BodyCustomise<T = null> = {
  $?: ICollectionQueryConfig<T>;
  $context?: IQueryContext;
  /** @deprecated No longer used */
  $schema?: any;
  $all?: boolean;
};

type SubBodyCustomise<T = null> = {
  $?: ValueOrValueResolver<ICollectionQueryConfig<T>>;
  $alias?: string;
  $all?: boolean;
  /** @deprecated No longer used */
  $schema?: any;
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
// Nested field specification
// | {
//     [key: string]: SimpleFieldValue;
//   };

type Unpacked<T> = T extends (infer U)[] ? U : T;

type HasID<T> = "_id" extends keyof Unpacked<T> ? true : false;

export type AnyifyFieldsWithIDs<T> = {
  [K in keyof T]: true extends HasID<T[K]> ? any : T[K];
};

export type AnyBody = {
  $alias?: string;
  /** @deprecated */
  $schema?: any;
  [key: string]:
    | string
    | SimpleFieldValue
    | ValueOrValueResolver<ICollectionQueryConfig>
    | AnyBody;
};

type RootSpecificBody<T> = {
  [K in keyof T]?:
    | SimpleFieldValue
    // We do this because the type might be an array
    | QuerySubBodyType<Unpacked<T[K]>>;
};

export type QueryBodyType<T = null> = BodyCustomise<T> &
  (T extends null ? AnyBody : RootSpecificBody<T>);

export type QuerySubBodyType<T = null> = SubBodyCustomise<T> &
  (T extends null ? AnyBody : RootSpecificBody<T>);

type Primitive =
  | string
  | Function
  | number
  | boolean
  | Symbol
  | undefined
  | null;

type DeepOmitHelper<T, K extends keyof T> = {
  [P in K]: T[P] extends infer TP //extra level of indirection needed to trigger homomorhic behavior // distribute over unions
    ? TP extends Primitive
      ? TP // leave primitives and functions alone
      : TP extends any[]
      ? DeepOmitArray<TP, K> // Array special handling
      : DeepOmit<TP, K>
    : never;
};

type DeepOmitArray<T extends any[], K> = {
  [P in keyof T]: DeepOmit<T[P], K>;
};

type DeepOmit<T, K> = T extends Primitive
  ? T
  : DeepOmitHelper<T, Exclude<keyof T, K>>;
