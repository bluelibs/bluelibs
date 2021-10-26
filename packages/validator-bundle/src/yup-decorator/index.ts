import { ObjectSchema, BaseSchema } from "yup";
import * as yup from "yup";

export type SchemaOrSchemaCreator = BaseSchema<any> | (() => BaseSchema<any>);
export type ModelCreator = () => any;

/**
 *
 */
export class MetadataStorage {
  private _metadataMap = new Map<
    Function,
    Map<string, SchemaOrSchemaCreator>
  >();

  addSchemaMetadata({ target, schema, property }) {
    let schemaMap = this._metadataMap.get(target);
    if (!schemaMap) {
      schemaMap = new Map<string, SchemaOrSchemaCreator>();
      this._metadataMap.set(target, schemaMap);
    }
    schemaMap.set(property, schema);
  }

  getMetadata(target) {
    return this._metadataMap.get(target);
  }

  findSchemaMetadata(target) {
    const hierarchy = this.getClassHierarchy(target).reverse();
    const result = hierarchy
      .map((target) => this.getMetadata(target))
      .filter((target) => Boolean(target));

    const entries = [];
    result.forEach((r) => {
      entries.push(...r.entries());
    });

    return new Map<string, SchemaOrSchemaCreator>(entries);
  }

  /**
   * Get the hierarchy including self.
   * @param baseClass
   * @returns
   */
  getClassHierarchy(baseClass: Function): Function[] {
    let constructors: Function[] = [];
    let currentConstructor: Function = baseClass;
    while (currentConstructor != Function.prototype) {
      constructors.push(currentConstructor);
      currentConstructor = Object.getPrototypeOf(currentConstructor);
    }

    return constructors.filter((c) => Boolean(c));
  }
}

const metadataStorage = new MetadataStorage();

const yupSchemas = new Map<Function, ObjectSchema<any>>();
const yupSchemaCreators = new Map<Function, () => ObjectSchema<any>>();

/**
 * Get the schema by type
 * @param target the object's type (class)
 * @returns The yup schema
 */
export function getSchemaByType(target: Object): ObjectSchema<any> {
  const constructor = target instanceof Function ? target : target.constructor;

  let schema = yupSchemas.get(constructor);

  if (!schema) {
    schema = createAndStoreSchema(constructor);
  }

  return schema;
}

/**
 * Register a schema
 * @param objectSchema The initial schema
 */
export function schema(
  objectSchema: ObjectSchema<any> = yup.object()
): ClassDecorator {
  return (target) => {
    // The idea is that we don't generate the schema on the fly
    // We get the schema via SchemaStorage service which is responsible of
    yupSchemaCreators.set(target, () => defineSchema(target, objectSchema));
  };
}

function createAndStoreSchema(model: Function) {
  const creator = yupSchemaCreators.get(model);
  if (!creator) {
    console.error("Error finding the schema for", model);
    throw new Error(`No schema creator attached to this model: `);
  }

  const schema = yupSchemaCreators.get(model)();
  yupSchemas.set(model, schema);

  return schema;
}

schema.from = (model: any): ObjectSchema<any> => {
  return getSchemaByType(model);
};

/**
 * Register a schema to the given property
 * @param schema the schema to register
 */
export function is(schema: SchemaOrSchemaCreator): PropertyDecorator {
  return (target: Object, property: string | symbol) => {
    metadataStorage.addSchemaMetadata({
      target: target instanceof Function ? target : target.constructor,
      property,
      schema,
    });
  };
}

/**
 * Register an object schema to the given property
 * @deprecated Please use @Is(Schema.from(User))
 */
export function nested(modelCreator?: ModelCreator): PropertyDecorator {
  return (target: Object, property: string | symbol) => {
    let schema: SchemaOrSchemaCreator;
    if (!modelCreator) {
      const nestedType = Reflect.getMetadata("design:type", target, property);

      let schema = getSchemaByType(nestedType);
      if (!schema) {
        const savedSchema = metadataStorage.findSchemaMetadata(nestedType);
        if (!savedSchema) {
          return;
        }
        // if the schema was not registered via @Schema, build one for it automatically
        schema = defineSchema(nestedType, yup.object());
      }
    } else {
      schema = () => {
        return getSchemaByType(modelCreator());
      };
    }

    metadataStorage.addSchemaMetadata({
      target: target instanceof Function ? target : target.constructor,
      property,
      schema,
    });
  };
}

export interface IValidateArguments {
  object: object;
  options?: ValidateOptions;
}

export interface IValidatePathArguments {
  object: object;
  options?: ValidateOptions;
  path: string;
}

function getSchema({ object }) {
  if (object === null || typeof object !== "object") {
    throw new Error("Cannot validate non object types");
  }

  return getSchemaByType(object.constructor);
}

export interface ValidateOptions<TContext = {}> {
  /**
   * Only validate the input, and skip and coercion or transformation. Default - false
   */
  strict?: boolean;
  /**
   * Return from validation methods on the first error rather than after all validations run. Default - true
   */
  abortEarly?: boolean;
  /**
   * Remove unspecified keys from objects. Default - false
   */
  stripUnknown?: boolean;
  /**
   * When false validations will not descend into nested schema (relevant for objects or arrays). Default - true
   */
  recursive?: boolean;
  /**
   * Any context needed for validating schema conditions (see: when())
   */
  context?: TContext;
}

export const a = yup;
export const an = yup;

function defineSchema(target, objectSchema: ObjectSchema<any>) {
  const schemaMap = metadataStorage.findSchemaMetadata(target);

  if (!schemaMap) {
    return;
  }

  const objectShape = Array.from(schemaMap.entries()).reduce(
    (currentShape, [property, schema]) => {
      if (schema instanceof Function) {
        currentShape[property] = schema();
      } else {
        currentShape[property] = schema;
      }
      return currentShape;
    },
    {}
  );
  objectSchema = objectSchema.shape(objectShape);
  return objectSchema;
}
