import * as _ from "lodash";
import { GenericModel } from "../models";
import { IGenericField, GenericFieldTypeEnum } from "../models/defs";
import * as Inflected from "inflected";

export class ModelUtils {
  static getFieldSignatureForGraphQL(field: IGenericField) {
    let signature = GraphQLFieldMap[field.type];
    if (!signature) {
      signature =
        field.type === GenericFieldTypeEnum.MODEL
          ? field.model?.name
          : field.type;
    }
    if (field.isMany) {
      signature = "[" + signature + "]";
    }
    if (!field.isOptional) {
      signature = signature + "!";
    }

    return `${field.name}: ${signature}`;
  }

  static getFieldSignatureForTS(field: IGenericField) {
    let signature;
    let fieldName = field.name;

    if (this.isFieldModel(field)) {
      if (field.model?.storage === "embed") {
        signature = field.model.fields
          .map((field) => this.getFieldSignatureForTS(field))
          .join("\n");
        signature = `{${signature}}`;
      } else {
        signature =
          field.type === GenericFieldTypeEnum.MODEL
            ? field.model?.name
            : field.type;
      }
    } else {
      signature = TSFieldMap[field.type];
    }

    if (field.isMany) {
      signature = signature + "[]";
    }

    if (field.isOptional) {
      fieldName = fieldName + "?";
    }

    const defaultValue = ModelUtils.getDefaultValue(field);

    if (defaultValue === undefined) {
      return `${fieldName}: ${signature};`;
    } else {
      return `${fieldName}: ${signature} = ${defaultValue};`;
    }
  }

  /**
   * @param field
   * @param modelClass Represents the context of enum: InvoiceStatus
   */
  static getEnumSignatureForTS(
    field: IGenericField,
    modelClass?: string,
    reuseEnums?: boolean
  ) {
    let fieldName = field.name;
    let signature = ModelUtils.getEnumClassName(field, modelClass, reuseEnums);

    if (field.isMany) {
      signature += "[]";
    }

    if (field.isOptional) {
      fieldName += "?";
    }

    let defaultValue = "";
    if (field.defaultValue) {
      defaultValue = `= ${signature}.${field.defaultValue}`;
    }

    return `${fieldName}: ${signature}${defaultValue}`;
  }

  /**
   * @param field
   * @param modelClass Represents the context of enum: InvoiceStatus
   */
  static getEnumSignatureForGraphQL(
    field: IGenericField,
    modelClass?: string,
    reuseEnums?: boolean
  ) {
    let fieldName = field.name;
    let signature = ModelUtils.getEnumClassName(field, modelClass, reuseEnums);
    if (field.isMany) {
      signature = `[${signature}]`;
    }
    if (!field.isOptional) {
      signature = signature + "!";
    }

    return `${fieldName}: ${signature}`;
  }

  static getYupValidatorDecorator(
    field: IGenericField,
    modelClass?: string,
    reuseEnums?: boolean
  ) {
    const isModel = field.type === GenericFieldTypeEnum.MODEL;

    if (isModel) {
      if (field.model.isEnumAlias) {
        return this.getYupValidatorDecorator(
          {
            name: field.model.name,
            type: GenericFieldTypeEnum.ENUM,
            isMany: field.isMany,
          },
          ""
        );
      }

      if (field.model.isInterface) {
        return "";
      }

      if (field.isMany) {
        return `@Is(() => an.array().of(Schema.from(${field.model.name})))`;
      } else {
        return `@Is(() => Schema.from(${field.model.name}))`;
      }
    }

    let yupType = YupFieldMap[field.type];

    if (!yupType) {
      return "";
    }

    const aWhat = startsWithVowel(yupType) ? "an" : "a";
    let typeSuffix = "";

    if (field.type === GenericFieldTypeEnum.ENUM) {
      const enumClassName = ModelUtils.getEnumClassName(
        field,
        modelClass,
        reuseEnums
      );
      typeSuffix = `.oneOf(Object.values(${enumClassName}))`;
    }

    // We do this because sometimes you want to update an id and want it nullifiable
    if (field.name !== "_id" && !field.isMany && field.isOptional) {
      typeSuffix += ".nullable()";
    }

    yupType += "()" + typeSuffix;

    if (field.isMany) {
      yupType = `an.array().of(${aWhat}.${yupType})`;
    } else {
      yupType = `${aWhat}.${yupType}`;
    }

    const isRequired = !field.isOptional ? ".required()" : "";

    return `@Is(${yupType}${isRequired})`;
  }

  /**
   *
   * @param field
   * @param modelClass
   * @param reuseEnums This means that the created enums will be re-used from the original ones in collection
   * @returns
   */
  static getEnumClassName(
    field: IGenericField,
    modelClass?: string,
    reuseEnums?: boolean
  ): string {
    if (modelClass && reuseEnums) {
      modelClass = modelClass.replace("Input", "");
    }

    let name = field.name;
    if (field.isMany) {
      name = Inflected.singularize(field.name);
    }

    return modelClass + _.upperFirst(name);
  }

  static isFieldModel(field: IGenericField) {
    return (
      field.type === GenericFieldTypeEnum.MODEL ||
      !PRIMITIVES.includes(field.type as GenericFieldTypeEnum)
    );
  }

  /**
   * Based on the default value it returns the `= VALUE`.
   * Note: it does not take into account enums
   * @param field
   * @returns
   */
  static getDefaultValue(field: IGenericField) {
    let defaultValue = undefined;

    if (field.defaultValue === undefined) {
      if (field.isMany) {
        defaultValue = "[]";
      }
    } else {
      // This is because when in input mode, enums are outside, and we have engine of hooking it via model
      if (field.model && field.model.isEnumAlias) {
        defaultValue = `${field.model.name}.${field.defaultValue}`;
      } else if (typeof field.defaultValue === "string") {
        defaultValue = `"${field.defaultValue}"`;
      } else if (field.defaultValue instanceof Date) {
        defaultValue = `new Date()`;
      } else {
        defaultValue = JSON.stringify(field.defaultValue);
      }
    }
    if (defaultValue !== undefined) {
      return defaultValue;
    }

    return undefined;
  }
}

export const PRIMITIVES = [
  GenericFieldTypeEnum.BOOLEAN,
  GenericFieldTypeEnum.STRING,
  GenericFieldTypeEnum.DATE,
  GenericFieldTypeEnum.FLOAT,
  GenericFieldTypeEnum.INT,
  GenericFieldTypeEnum.OBJECT,
  GenericFieldTypeEnum.ENUM,
  GenericFieldTypeEnum.ID,
];

export const GraphQLFieldMap = {
  [GenericFieldTypeEnum.BOOLEAN]: "Boolean",
  [GenericFieldTypeEnum.STRING]: "String",
  [GenericFieldTypeEnum.DATE]: "Date",
  [GenericFieldTypeEnum.FLOAT]: "Float",
  [GenericFieldTypeEnum.INT]: "Int",
  [GenericFieldTypeEnum.OBJECT]: "JSON",
  [GenericFieldTypeEnum.ID]: "ObjectId",
};

export const TSFieldMap = {
  [GenericFieldTypeEnum.BOOLEAN]: "boolean",
  [GenericFieldTypeEnum.STRING]: "string",
  [GenericFieldTypeEnum.DATE]: "Date",
  [GenericFieldTypeEnum.FLOAT]: "number",
  [GenericFieldTypeEnum.INT]: "number",
  [GenericFieldTypeEnum.OBJECT]: "any",
  [GenericFieldTypeEnum.ID]: "any",
};

export const YupFieldMap = {
  [GenericFieldTypeEnum.BOOLEAN]: "boolean",
  [GenericFieldTypeEnum.STRING]: "string",
  [GenericFieldTypeEnum.ENUM]: "string",
  [GenericFieldTypeEnum.DATE]: "date",
  [GenericFieldTypeEnum.FLOAT]: "number",
  [GenericFieldTypeEnum.INT]: "number",
  [GenericFieldTypeEnum.OBJECT]: "mixed",
  [GenericFieldTypeEnum.ID]: "objectId",
};

export const YupClassFieldMap = {
  [YupFieldMap[GenericFieldTypeEnum.BOOLEAN]]: "BooleanSchema",
  [YupFieldMap[GenericFieldTypeEnum.STRING]]: "StringSchema",
  [YupFieldMap[GenericFieldTypeEnum.DATE]]: "DateSchema",
  [YupFieldMap[GenericFieldTypeEnum.FLOAT]]: "NumberSchema",
  [YupFieldMap[GenericFieldTypeEnum.INT]]: "NumberSchema",
  [YupFieldMap[GenericFieldTypeEnum.OBJECT]]: "ObjectSchema",
  [YupFieldMap[GenericFieldTypeEnum.ID]]: "ObjectIdSchema",
};

function startsWithVowel(x) {
  return /[aeiouAEIOU]/.test(x[0]);
}
