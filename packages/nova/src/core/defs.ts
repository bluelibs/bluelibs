import {
  AggregateOptions,
  ClientSession,
  Collection,
  Document,
  Filter as FilterQuery,
  Hint,
} from "mongodb";

export interface IToArrayable {
  toArray(): Promise<unknown[]>;
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
  // why: Filter<T> is invariant; only FilterQuery<any> accepts the filter of a
  // generic T, and in the null case the filter is arbitrary user input anyway.
  filters?: T extends null ? FilterQuery<any> : FilterQuery<AnyifyFieldsWithIDs<T>>;
  options?: IQueryOptions<T>;
  /**
   * This gets deeply merged with the body (useful for $ argument)
   */
  sideBody?: QueryBodyType<T>;
}

export interface IAstToQueryOptions<T = null> extends ISecureOptions<T> {
  embody?(body: QueryBodyType<T>, getArguments: (path: string) => Record<string, unknown>);
}

export interface IStorageData {
  links: ILinkOptions;
  reducers: IReducerOptions;
  expanders: IExpanderOptions;
}

export interface IFindOptions {
  [key: string]: unknown;
}

/**
 * We are now using the MongoCollection as our reference.
 * @deprecated
 */
export interface ICollection {
  aggregate: Collection["aggregate"];
  collectionName: string;
}

export type HardwiredFiltersOptions = {
  filters?: FilterQuery<Document>;
};
export interface ILinkCollectionOptions {
  // why: the linked collection is typed by the user; Collection<T> is not
  // assignable to Collection<Document>, so it has to stay Collection<any>.
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
  filters?: FilterQuery<Document> | ((options: HardwiredFiltersOptions) => FilterQuery<Document>);
}

// why: the parent document passed to `reduce` is runtime-shaped (the
// `dependency` only requests a projection of it) and cannot be statically
// inferred by the library, so the `ParentType` (and `ReturnType`) defaults are
// `any` (not `unknown`) to restore the published pre-cleanup signature and keep
// consumer reducers like `reduce(user) { user.password }` compiling. The same
// reasoning applies to `AnyObject`: params are runtime-shaped.
export type AnyObject = { [key: string]: any };
export interface IReducerOption<ReturnType = any, ParamsType = AnyObject, ParentType = any> {
  dependency: DeepOmit<QueryBodyType, "$">;
  pipeline?: Document[] | ((context: IQueryContext) => Document[]);
  projection?: Document;
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

export type ValueOrValueResolver<T> = T | ((...args: unknown[]) => T);

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
export interface IQueryOptions<T = Document> extends AggregateOptions {
  limit?: number;
  skip?: number;
  sort?:
    | Array<[string, number]>
    | {
        [key in keyof T]?: number | boolean;
      }
    | { [key: string]: number | boolean };
  /**
   * MongoDB index hint to force the query to use a specific index. The value can be
   * either the index name (string) or an object specifying the index keys.
   * It will be forwarded to the MongoDB driver when Nova executes the aggregation
   * pipeline corresponding to this node.
   */
  hint?: Hint;
  projection?:
    | {
        [key in keyof T]?: number | boolean;
      }
    | { [key: string]: number | boolean };
}

export interface ICollectionQueryConfig<T = Document> {
  // why: Filter<T> is invariant; only FilterQuery<any> accepts the filter of a generic T.
  filters?: T extends null ? FilterQuery<any> : FilterQuery<AnyifyFieldsWithIDs<T>>;
  options?: IQueryOptions<T>;
  pipeline?: Document[];
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
  $schema?: unknown;
  $all?: boolean;
};

type SubBodyCustomise<T = null> = {
  $?: ValueOrValueResolver<ICollectionQueryConfig<T>>;
  $alias?: string;
  $all?: boolean;
  /** @deprecated No longer used */
  $schema?: unknown;
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
      $filter: Document;
    };
// Nested field specification
// | {
//     [key: string]: SimpleFieldValue;
//   };

type Unpacked<T> = T extends (infer U)[] ? U : T;

type HasID<T> = "_id" extends keyof Unpacked<T> ? true : false;

export type AnyifyFieldsWithIDs<T> = {
  // why: fields that themselves contain an _id must stay fully flexible (arbitrary filter), a mapped type cannot express that
  [K in keyof T]: true extends HasID<T[K]> ? any : T[K];
};

export type AnyBody = {
  $alias?: string;
  /** @deprecated */
  $schema?: unknown;
  [key: string]: string | SimpleFieldValue | ValueOrValueResolver<ICollectionQueryConfig> | AnyBody;
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

/**
 * The value a field can hold in a query body: a projection flag, a projection
 * operator, reducer params or a nested sub-body.
 */
export type FieldBodyType = SimpleFieldValue | QueryBodyType;

type Primitive =
  string | ((...args: unknown[]) => unknown) | number | boolean | symbol | undefined | null;

type DeepOmitHelper<T, K extends keyof T> = {
  [P in K]: T[P] extends infer TP //extra level of indirection needed to trigger homomorhic behavior // distribute over unions
    ? TP extends Primitive
      ? TP // leave primitives and functions alone
      : TP extends unknown[]
        ? DeepOmitArray<TP, K> // Array special handling
        : DeepOmit<TP, K>
    : never;
};

type DeepOmitArray<T extends unknown[], K> = {
  [P in keyof T]: DeepOmit<T[P], K>;
};

type DeepOmit<T, K> = T extends Primitive ? T : DeepOmitHelper<T, Exclude<keyof T, K>>;
