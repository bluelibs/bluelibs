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
  /**
   * This states whether the field is an array or not
   */
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
  isEnumAlias?: boolean;
  /**
   * This refers to when you have a specific type of model that is an interface
   */
  isInterface?: boolean;
}

export type EnumConfigType = {
  /**
   * The id which identifies it in the code, prefer capitalisation: IN_PROGRESS
   */
  id: string;
  /**
   * The value, if left empty it will default to the id
   */
  value?: string;
  /**
   * How is this presented to the client, sometimes the label can be different from id and value. If missing it will default to the value.
   */
  label?: string;
  /**
   * Describe the comment of the enum
   */
  description?: string;
};

export interface IGenericField extends IFieldBaseSignature {
  name: string;
  /**
   * Information about what this field does
   */
  description?: string;
  /**
   * The default value of this field. This should be JSON-compatible. If it relates an `enum` it should be the `enum` identifier.
   */
  defaultValue?: any;
  /**
   * Whether to render in typescript/graphql
   */
  ignoreTypeScript?: boolean;
  ignoreGraphQL?: boolean;
  enumValues?: EnumConfigType[];
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

export type EnumConfigExtractResult = {
  className: string;
  elements: EnumConfigType[];
  importFrom: string;
};
