import { ClientSession, Collection, FilterQuery } from "mongodb";
import { ClassSchema } from "@deepkit/type";

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
  filters?: T extends null ? FilterQuery<any> : FilterQuery<T>;
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
  collection: () => Collection;
  field?: string;
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
  dependency: QueryBodyType;
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
  filters?: T extends null ? FilterQuery<any> : FilterQuery<T>;
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
  $schema?: ClassSchema;
  $all?: boolean;
};

type SubBodyCustomise<T = null> = {
  $?: ValueOrValueResolver<ICollectionQueryConfig<T>>;
  $alias?: string;
  $all?: boolean;
  $schema?: ClassSchema;
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

export type AnyBody = {
  $alias?: string;
  $schema?: ClassSchema;
  [key: string]:
    | string
    | ClassSchema
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
