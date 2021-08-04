export enum ModelRaceEnum {
  GRAPHQL_TYPE = "graphql-type",
  CLASSLIKE = "class-like",
  INTERFACE = "interface",
  GRAPHQL_INPUT = "graphql-input",
}

export enum GenericFieldTypeEnum {
  STRING = "string",
  BOOLEAN = "boolean",
  FLOAT = "float",
  INT = "integer",
  DATE = "date",
  OBJECT = "object",
  ID = "id",
  MODEL = "model",
  ENUM = "enum",
}

export interface IFieldBaseSignature {
  type: GenericFieldTypeEnum | string;
  isOptional?: boolean;
  isMany?: boolean;
}

export interface IGenericFieldSubModel {
  /**
   * How is the name called?
   * @example UserProfile
   */
  name: string;
  fields?: IGenericField[];
  /**
   * "embed" means that it starts defining the model directly in the superclass
   * "outside" means that it's outside the model, it can be in another file, package, or locally etc.
   */
  storage: "embed" | "outside";
  /**
   * This represents whether the model is situated in the same file. Most of the times it isn't. If the model isn't local, fields can be optional.
   */
  local?: boolean;
  /**
   * If the type is model, the name represents the model name, modelReferenceBundle means a different bundle
   * The models get imported from collections
   * @example DocumentsBundle
   */
  referenceBundle?: string;
  /**
   * This is for when the import is done absolutely import { Model }
   * @example "@root/types"
   * @example "@bluelibs/security-bundle"
   */
  absoluteImport?: string;
  /**
   * When dealing with inputs, we treat "enums" as external models. However,
   * this can break validation, because for external models we don't do this.
   * By specifying this as true, we say: It's an external model, but perform enum-like validation on it.
   */
  validateAsEnum?: boolean;
  /**
   * This refers to when you have a specific type of model that is an interface
   */
  isInterface?: boolean;
}

export interface IGenericField extends IFieldBaseSignature {
  name: string;
  /**
   * Information about what this field does
   */
  description?: string;
  /**
   * Whether to render in typescript/graphql
   */
  ignoreTypeScript?: boolean;
  ignoreGraphQL?: boolean;
  /**
   * When the type is enum we need to also specify the csv values of it
   * @example In Progress,Open,Done
   */
  enumCSVValues?: string;
  /**
   * When type is unknown or model, we generate the model.
   */
  model?: IGenericFieldSubModel;
  /**
   * If left undefined, it will behave based on model it's in
   * If it is `false` and the model has yup validation, it won't validate it
   */
  yupValidation?: boolean;
}
