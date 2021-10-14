import * as _ from "lodash";
import { ModelUtils } from "../utils/ModelUtils";
import {
  ModelRaceEnum,
  IGenericField,
  GenericFieldTypeEnum,
  IGenericFieldSubModel,
} from "./defs";
import * as path from "path";
import { EnumConfigType } from ".";

// This model can be inquired for asking:
// GraphQL Types, Inputs, Model Classes

export type ToContentOptions = {
  enumPrefix?: string;
};

type EnumConfigExtractResult = {
  className: string;
  elements: EnumConfigType[];
  importFrom: string;
};

const ToContentDefaults = {
  enumPrefix: "",
};

export class GenericModel {
  // Note: When you add additional fields don't forget to look at .clone() function

  race: ModelRaceEnum;
  name: string;
  fields: IGenericField[] = [];
  yupValidation: boolean = false;
  /**
   * This refers whether the actual model is stored in .base.ts and the model is extended from it
   * Allowing code-generators to write in base, and you to modify the model
   */
  isBaseExtendMode: boolean = false;

  /**
   * This refers to whether we are dealing with inputs and enums, typically you don't want new enums when you're dealign with inputs which reflect an entity.
   */
  reuseEnums: boolean = false;

  /**
   * Whether you are dealing with an input
   */
  isInputMode: boolean = false;

  // Where should it be written
  targetPath?: string;

  public _skipModelNameQuestion = false;

  constructor(name?: string, race?: ModelRaceEnum, fields?: IGenericField[]) {
    this.name = name;
    if (race) {
      this.race = race;
    }
    if (fields) {
      this.fields = fields;
    }
  }

  get localBaseName() {
    const basenameParts = path.basename(this.targetPath).split(".");
    basenameParts.pop();
    basenameParts.push("base");

    return basenameParts.join(".");
  }

  // Most likely we clone it because we want to change the race
  static clone(model: GenericModel) {
    const newModel = new GenericModel();
    [
      "race",
      "name",
      "yupValidation",
      "targetPath",
      "isBaseExtendMode",
      "reuseEnums",
      "isInputMode",
    ].forEach((field) => (newModel[field] = model[field]));

    newModel.fields = model.fields.map((field) => {
      return Object.assign({}, field);
    });

    return newModel;
  }

  getField(name: string): IGenericField {
    return this.fields.find((field) => field.name === name);
  }

  addField(field: IGenericField, first = false) {
    // Ensure uniqueness of name
    if (this.hasField(field.name)) {
      throw new Error(
        `You have already added the field with name: ${field.name}`
      );
    }

    if (first) {
      this.fields = [field, ...this.fields];
    } else {
      this.fields.push(field);
    }
  }

  removeField(fieldName: string) {
    this.fields = this.fields.filter((field) => field.name !== fieldName);
  }

  hasField(name: string): boolean {
    return Boolean(this.fields.find((f) => f.name === name));
  }

  ensureIdField(): void {
    if (!this.hasField("_id")) {
      this.addField(
        {
          name: "_id",
          type: GenericFieldTypeEnum.ID,
          isMany: false,
        },
        true
      );
    }
  }

  get modelTypeName() {
    switch (this.race) {
      case ModelRaceEnum.GRAPHQL_TYPE:
        return "graphql type";
      case ModelRaceEnum.CLASSLIKE:
        return "model";
      case ModelRaceEnum.GRAPHQL_INPUT:
        return "input";
    }

    return "model";
  }

  get modelName() {
    return _.upperFirst(this.name);
  }

  get modelClass() {
    return _.upperFirst(this.name) + this.modelClassSuffix;
  }

  get modelClassSuffix(): string {
    switch (this.race) {
      case ModelRaceEnum.GRAPHQL_TYPE:
        return "";
      case ModelRaceEnum.CLASSLIKE:
        return "";
      case ModelRaceEnum.GRAPHQL_INPUT:
        return "Input";
    }

    return "";
  }

  toGraphQL = () => {
    return this.graphqlContents(this.fields);
  };

  toGraphQLSubmodel = (model: IGenericFieldSubModel) => {
    return this.graphqlContents(model.fields, {
      enumPrefix: model.name,
    });
  };

  toTypescript = () => {
    return this.tsContents(this.fields);
  };

  toTypescriptSubmodel = (model: IGenericFieldSubModel) => {
    return this.tsContents(model.fields, {
      enumPrefix: model.name,
    });
  };

  graphqlContents(
    fields: IGenericField[],
    options: ToContentOptions = ToContentDefaults
  ): string {
    let result = "";
    fields
      .filter((field) => !field.ignoreGraphQL)
      .forEach((field) => {
        if (field.description) {
          if (field.description) {
            result += `
"""
${field.description} 
"""
`;
          }
        }
        if (field.type === GenericFieldTypeEnum.ENUM) {
          result +=
            ModelUtils.getEnumSignatureForGraphQL(
              field,
              options.enumPrefix ? options.enumPrefix : this.modelClass,
              this.reuseEnums
            ) + "\n";
        } else {
          result += ModelUtils.getFieldSignatureForGraphQL(field) + "\n";
        }
      });

    return result;
  }

  tsContents(
    fields: IGenericField[],
    options: ToContentOptions = ToContentDefaults
  ): string {
    let result = "";

    fields
      .filter((field) => !field.ignoreTypeScript)
      .forEach((field) => {
        if (this.isFieldPartOfSubmodel(field)) {
          console.error({ field });
          throw new Error("We do not allow fields that contain a dot.");
        }
        if (field.description) {
          result += `
/**
 * @description ${field.description} 
 */
`;
        }

        if (this.yupValidation) {
          // It can still be undefined it'll be ok, it just doesn't need to be false
          if (field.yupValidation !== false) {
            const yupDecorator = ModelUtils.getYupValidatorDecorator(
              field,
              options.enumPrefix ? options.enumPrefix : this.modelClass,
              this.reuseEnums
            );

            if (yupDecorator) {
              result += yupDecorator + "\n";
            }
          }
        }
        if (field.type === GenericFieldTypeEnum.ENUM) {
          result +=
            ModelUtils.getEnumSignatureForTS(
              field,
              options.enumPrefix ? options.enumPrefix : this.modelClass,
              this.reuseEnums
            ) + "\n";
        } else {
          result += ModelUtils.getFieldSignatureForTS(field) + "\n";
        }

        if (this.yupValidation) {
          // A decorator would need more space to be visibly attractive
          result += "\n";
        }
      });

    return result;
  }

  get models(): Array<{
    bundle?: string;
    className: string;
  }> {
    return this.fields
      .filter((field) => this.isFieldModel(field))
      .map((field) => {
        return {
          className: field.type,
          bundle: field.model?.referenceBundle,
        };
      });
  }

  get remoteModels(): IGenericFieldSubModel[] {
    const result = this.getFlatFields(this.fields, (field) => {
      return field.model?.storage === "outside" && field.model?.local === false;
    })
      .map((field) => {
        return field.model;
      })
      .filter((model) => {
        return model.name !== this.modelClass;
      })
      // uniqueness
      .filter((value, index, self) => {
        return self.map((v) => v.name).indexOf(value.name) === index;
      });

    return result;
  }

  get localModels(): IGenericFieldSubModel[] {
    return this.getFlatFields(this.fields, (field) => {
      return field.model?.storage === "outside" && field.model?.local === true;
    }).map((field) => field.model);
  }

  /**
   * TODO: make recursive so it goes deep otherwise it will fail.
   */
  get embeddedModels(): IGenericFieldSubModel[] {
    const result = this.fields
      .filter((field) => {
        return field.model?.storage === "embed";
      })
      .map((field) => field.model);

    return result;
  }

  sortFields() {
    this.fields = _.sortBy(this.fields, "name");
  }

  getFlatFields(
    fields: IGenericField[],
    filter: (field: IGenericField) => boolean
  ): IGenericField[] {
    const result: IGenericField[] = [];

    for (const field of fields) {
      if (filter(field)) {
        result.push(field);
      }
      if (field.model && field.model.fields) {
        result.push(...this.getFlatFields(field.model.fields, filter));
      }
    }

    return result;
  }

  /**
   * The logic here is that if the field is not inside the GenericFieldTypeEnum it's definitely a model.
   * @param field
   */
  isFieldModel(field: IGenericField): boolean {
    return ModelUtils.isFieldModel(field);
  }

  private extractAndAddEnumConfigToResult(
    fields: IGenericField[],
    result: EnumConfigExtractResult[],
    parentFieldName: string = ""
  ) {
    fields
      .filter((field) => field.type === GenericFieldTypeEnum.ENUM)
      .forEach((field) => {
        const className = ModelUtils.getEnumClassName(
          field,
          this.modelClass + parentFieldName,
          Boolean(parentFieldName)
        );

        result.push({
          className,
          elements: field.enumValues,
          importFrom: this.reuseEnums
            ? `../../collections`
            : `./enums/${className}.enum`,
        });
      });
  }

  get enums() {
    const result = [] as EnumConfigExtractResult[];

    // First level enums
    this.extractAndAddEnumConfigToResult(this.fields, result);

    // Second level enums
    this.fields.forEach((field) => {
      if (field.model && field.model.fields) {
        this.extractAndAddEnumConfigToResult(
          field.model.fields,
          result,
          _.upperFirst(field.name)
        );
      }
    });

    return result;
  }

  /**
   * TODO: Make it create fields out of dotted fields.
   */
  get submodels(): Array<{ GenericModel }> {
    return [];
  }

  protected isFieldPartOfSubmodel(field: IGenericField) {
    return field.name.indexOf(".") >= 0;
  }
}
