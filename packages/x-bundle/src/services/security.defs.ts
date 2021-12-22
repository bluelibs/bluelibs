import { QueryBodyType } from "@bluelibs/nova";
import { Filter } from "mongodb";

/**
 * Own field is the field that reflects user ownership.
 * For more complex situations such as tenant-based systems you can also ['companyId', 'companyId']
 * Where the first 'companyId' is stored at the model level you're securing and the second one is stored at User-level.
 */
type OwnField = string | [string, string];

type FieldSelection<T> = Array<T extends null ? string : keyof T>;

export type SecuritySchematic<T = null> = {
  roles?: {
    anonymous: SecuritySchematicRole<T>;
    authenticated: SecuritySchematicRole<T>;
    [key: string]: SecuritySchematicRole<T>;
  };
  /**
   * Options that will be stored as defaults for all the roles.
   */
  defaults?: SecuritySchematicRole<T>;
};

export type SecuritySchematicRole<T = null> = {
  find?: boolean | SecuritySchematicFind<T>;
  insertOne?: boolean | SecuritySchematicInsert<T>;
  updateOne?: boolean | SecuritySchematicUpdate<T>;
  deleteOne?: boolean | SecuritySchematicDelete<T>;
};

export type SecuritySchematicFind<T = null> = {
  filters?: Filter<T>;
  intersect?: QueryBodyType<T>;
  own?: string;
  maxLimit?: number;
  maxDepth?: number;
};

export type SecuritySchematicUpdate<T = null> = {
  own?: string;
  filters?: Filter<T>;
  intersect?: QueryBodyType<T>;
  allow?: FieldSelection<T>;
  deny?: FieldSelection<T>;
};

export type SecuritySchematicInsert<T = null> = {
  own?: string;
  filters?: Filter<T>;
  intersect?: QueryBodyType<T>;
  allow?: FieldSelection<T>;
  deny?: FieldSelection<T>;
};

export type SecuritySchematicDelete<T = null> = {
  own?: OwnField;
  filters?: Filter<T>;
};
