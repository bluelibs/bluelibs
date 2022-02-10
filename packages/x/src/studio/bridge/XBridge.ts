import * as Studio from "..";
import { Models } from "../..";
import { FieldValueKind } from "../models/FieldValueKind";
import * as _ from "lodash";
import { UIModeType } from "../defs";
import { ModelUtils } from "../../utils/ModelUtils";
import * as Inflected from "inflected";
import { EnumConfigType } from "../../models/defs";
import { SharedModel } from "../models/SharedModel";

export type ToGenericModelOptions = {
  graphql?: boolean;
  ui?: UIModeType;
  skipRelations?: boolean;
  isInput?: boolean;
};

/**
 * The XBridge connects Studio to the Writers of 'X'.
 */
export class XBridge {
  static collectionToGenericModel(
    collection: Studio.Collection,
    options: ToGenericModelOptions = {
      graphql: false,
    }
  ): Models.GenericModel {
    const model = new Models.GenericModel(collection.entityName);

    model.name = collection.entityName;
    model.yupValidation = true;
    model.isBaseExtendMode = true;

    let fields = collection.fields;
    let relations = collection.relations;

    if (options.graphql) {
      fields = fields.filter((f) => f.enableGraphQL);
      relations = relations.filter((r) => r.enableGraphQL);
    }

    if (options.ui) {
      // Apply filters for additional ui
      fields = fields.filter((f) => f.ui && f.ui[options.ui]);
      relations = relations.filter((r) => r.ui && r.ui[options.ui]);
    }

    fields.forEach((field) => {
      model.addField(XBridge.fieldToGenericField(field, options.isInput));
    });

    if (options.skipRelations) {
      // We don't do anything
    } else {
      if (options.isInput) {
        relations
          .filter((r) => r.isDirect)
          .forEach((r) => {
            model.addField(
              XBridge.fieldToGenericField(r.cleaned.field, options.isInput)
            );
          });
      } else {
        relations.forEach((relation) => {
          model.addField(XBridge.relationToGenericField(relation));
        });
      }
    }

    if (options.isInput) {
      model.isInputMode = true;
    }

    model.sortFields();

    return model;
  }

  /**
   * Transforms the models to generic fields properly.
   */
  static relationToGenericField(
    _relation: Studio.Relation
  ): Models.IGenericField {
    const relation = _relation.cleaned;
    if (relation.isDirect) {
      return {
        name: relation.id,
        type: relation.to.entityName,
        description: relation.description,
        isMany: relation.isMany,
        isOptional: !relation.field.isRequired,
        model: {
          storage: "outside",
          local: false,
          name: relation.to.entityName,
          absoluteImport: relation.to.isExternal()
            ? relation.to.externalPackage
            : undefined,
        },
      };
    } else {
      let isMany = true;
      if (relation.reversedRelation.unique) {
        isMany = false;
      }

      return {
        name: relation.id,
        description: relation.description,
        type: relation.to.entityName,
        isOptional: !relation.isRequired,
        isMany,
        model: {
          name: relation.to.entityName,
          local: false,
          storage: "outside",
        },
      };
    }
  }

  static fieldToGenericField(
    studioField: Studio.Field,
    isInput: boolean = false,
    enumPrefix?: string
  ): Models.IGenericField {
    if (!enumPrefix) {
      enumPrefix = studioField.collection
        ? studioField.collection.entityName
        : studioField.id;
    }

    const pathsInfo = XBridge.getPathInfos();

    const field: Models.IGenericField = {
      name: studioField.id,
      type: XBridge.mapFieldTypeToGenericField(studioField.type),
      isMany: studioField.isArray,
      description: studioField.description,
      isOptional: !studioField.isRequired,
      enumValues: studioField.enumValues as EnumConfigType[],
      defaultValue: studioField.defaultValue,
    };

    // Reducers can't be validated as they are sort of virtual fields
    if (studioField.isReducer) {
      field.yupValidation = false;
    }

    // We treat enums as external models when we are in TS input mode, because they already exist
    if (isInput && field.type === Models.GenericFieldTypeEnum.ENUM) {
      field.type = Models.GenericFieldTypeEnum.MODEL;
      field.model = {
        name:
          enumPrefix +
          _.upperFirst(
            studioField.isArray
              ? Inflected.singularize(studioField.id)
              : studioField.id
          ),
        storage: "outside",
        local: false,
        absoluteImport: pathsInfo.fromInputToAll,
        isEnumAlias: true,
      };
    }

    if (studioField.genericFieldSubmodel) {
      // CUSTOM NESTED STRUCTURE WITH EXTERNALS
      field.type = Models.GenericFieldTypeEnum.MODEL;
      field.model = studioField.genericFieldSubmodel;
    } else if (studioField.model) {
      // SHARED MODELS
      const sharedModel = studioField.model as SharedModel;
      if (sharedModel.isEnum()) {
        field.type = Models.GenericFieldTypeEnum.MODEL;
        field.model = {
          name: sharedModel.id,
          storage: "outside",
          local: false,
          isEnumAlias: true,
          absoluteImport: isInput
            ? `${pathsInfo.fromInputToModels}`
            : `${pathsInfo.fromModelToSharedModel}/${sharedModel.id}`,
        };
      } else {
        field.type = Models.GenericFieldTypeEnum.MODEL;
        let modelName = studioField.cleaned.model.id;

        field.model = {
          name: modelName + (isInput ? "Input" : ""),
          storage: "outside",
          local: false,
          absoluteImport: isInput
            ? `./${modelName}.input`
            : `${pathsInfo.fromModelToSharedModel}/${modelName}`,
        };
      }
    } else if (studioField.subfields.length > 0) {
      // STASNDARD NEXTED STRUCTURES
      field.type = Models.GenericFieldTypeEnum.MODEL;

      // if it's called items, the modelisation will be suffixed with Item
      let fieldSuffix = field.isMany
        ? Inflected.singularize(studioField.id)
        : studioField.id;

      let suffix = _.upperFirst(fieldSuffix);
      const name = studioField.collection.entityName + suffix;

      field.model = {
        name,
        storage: "outside",
        local: true,
        fields: studioField.subfields.map((subfield) =>
          XBridge.fieldToGenericField(subfield, isInput, enumPrefix + suffix)
        ),
      };
      if (isInput) {
        field.model.name += "Input";
        // field.model.local = false;
        // field.model.fields = [];
        // field.model.absoluteImport = pathsInfo.fromInputToModels;
      }
    }

    return field;
  }

  static getPathInfos() {
    return {
      sharedModelPathInBundle: "collections/shared",
      fromModelToSharedModel: "../shared",
      fromInputToAll: "../../collections",
      fromInputToModels: "../../collections",
    };
  }

  static mapFieldTypeToGenericField(
    type: FieldValueKind
  ): Models.GenericFieldTypeEnum {
    switch (type) {
      case FieldValueKind.BOOLEAN:
        return Models.GenericFieldTypeEnum.BOOLEAN;
      case FieldValueKind.DATE:
        return Models.GenericFieldTypeEnum.DATE;
      case FieldValueKind.FLOAT:
        return Models.GenericFieldTypeEnum.FLOAT;
      case FieldValueKind.INTEGER:
        return Models.GenericFieldTypeEnum.INT;
      case FieldValueKind.STRING:
        return Models.GenericFieldTypeEnum.STRING;
      case FieldValueKind.ENUM:
        return Models.GenericFieldTypeEnum.ENUM;
      case FieldValueKind.OBJECT_ID:
        return Models.GenericFieldTypeEnum.ID;
      case FieldValueKind.OBJECT:
        return Models.GenericFieldTypeEnum.OBJECT;
      default:
        throw new Error(
          `Could not match field type: ${type} to GenericFieldType.`
        );
    }
  }
}
