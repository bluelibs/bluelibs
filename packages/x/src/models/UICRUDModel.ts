import * as _ from "lodash";
import * as Studio from "../studio";
import { Field, SharedModel, UIModeType } from "../studio";
import { XBridge } from "../studio/bridge/XBridge";
import { FieldValueKind } from "../studio/models/FieldValueKind";
import { Relation } from "../studio/models/Relation";
import { ModelUtils } from "../utils";
import { EnumConfigType } from "./defs";

type FilesType = "file" | "files" | "fileGroup";

type RendererType = "relation" | "number" | "tag" | FilesType | FieldValueKind;

export type ViewItemModel = {
  id: string;
  title: string;
  key: string;
  dataIndex?: string;
  sorter: string | boolean;
  isMany: boolean;
  required?: boolean;
  order?: number;
  description?: string;
  /**
   * If it's an array or a string it renders it directly
   */
  dataIndexStr?: string;
  enumValues?: Array<{ label: string; value: string }>;
  rendererType: RendererType;

  relational?: boolean;
  remoteField?: string;
  remoteCollectionClass?: string;
  routeName?: string;

  subfields?: ViewItemModel[];

  /**
   * The default value the form will initially have in (create) mode only
   */
  defaultValue?: any;

  form?: {
    component: string;
    props?: string;
  };
};

export type CRUDFeatureType = "create" | "edit" | "view" | "list" | "delete";
export class UICRUDModel {
  studioCollection: Studio.Collection;
  bundleName: string;
  features:
    | true
    | {
        [key in CRUDFeatureType]?: boolean;
      } = true;
  typesToImport: { create?: string; edit?: string } = {};

  hasFeature(feature: CRUDFeatureType) {
    if (this.features === true) {
      return true;
    }
    return this.features[feature];
  }

  generateApiTypesImports(feature: string): string | null {
    let types = [];
    //enums types needed when we have intial default value
    types = types.concat(
      this.studioCollection.fields
        .filter(
          (field: Field) =>
            field.defaultValue &&
            field.type === "enum" &&
            field.model &&
            field.ui &&
            !(field.ui[feature] === false)
        )
        .map((field: Field) => field.cleaned.model.id)
    );
    if (types && types.length > 0) return types.join(", ");
    return null;
  }

  get sheetName() {
    if (this.studioCollection.ui === false) {
      throw new Error("Shouldn't generate CRUD for it");
    }

    return this.studioCollection.ui.label;
  }

  // The icon from UI Generated.
  get icon() {
    if (this.studioCollection.ui === false) {
      throw new Error("Shouldn't add a menu for it");
    }

    return this.studioCollection.ui.icon || "SettingFilled";
  }

  get collectionName() {
    return this.studioCollection.id;
  }

  get collectionClass() {
    return this.collectionName + "Collection";
  }

  get entityName() {
    return this.studioCollection.entityName;
  }

  /**
   * Based on the UI mode it generates the GraphQL request body to be sent to server when a specific page is reached
   * @param mode
   * @returns
   */
  generateRequestBodyAsString(mode: UIModeType) {
    let body = {
      _id: 1,
    };
    this.recursiveBodyExpand(mode, body, this.studioCollection.fields);

    this.studioCollection.getRelationshipsByUIMode(mode).forEach((r) => {
      body[r.id] = {
        _id: 1,
        [r.cleaned.representedBy.id]: 1,
      };
      if (r.isDirect) {
        body[r.cleaned.field.id] = 1;
      }

      if (r.isFileSimpleRelated()) {
        Object.assign(body[r.id], {
          downloadUrl: 1,
          name: 1,
        });
      }
      if (r.isFileGroupRelated()) {
        Object.assign(body[r.id], {
          name: 1,
          files: {
            downloadUrl: 1,
            name: 1,
          },
        });
      }
    });

    return JSON.stringify(body, null, 2);
  }

  /**
   * The idea here is that when we request a body we have to request it's nested fields
   * @param mode
   * @param body
   * @param fields
   * TODO: move to own function separated from here
   */
  recursiveBodyExpand(mode: UIModeType, body: object, fields: Field[]) {
    fields.forEach((field) => {
      const model = field.model as SharedModel;
      if (model && !model.isEnum()) {
        body[field.id] = {};
        this.recursiveBodyExpand(
          mode,
          body[field.id],
          field.cleaned.model.fields
        );

        // If the subfields haven't been found
        if (Object.keys(body).length === 0) {
          delete body[field.id];
        }
      } else if (field.subfields.length) {
        body[field.id] = {};
        this.recursiveBodyExpand(mode, body[field.id], field.subfields);

        // If the subfields haven't been found
        if (Object.keys(body).length === 0) {
          delete body[field.id];
        }
      } else {
        if (field.ui && field.ui[mode]) {
          body[field.id] = 1;
        }
      }
    });
  }

  collectionRoutePath() {
    return _.kebabCase(this.collectionName);
  }

  /**
   * Collection is Posts, name is: new => POSTS_NEW
   * @param name
   */
  generateRouteName(name: string) {
    return this.generateRouteNameForCollection(this.studioCollection.id, name);
  }

  generateRouteNameForCollection(collectionName, name: string) {
    return _.toUpper(_.snakeCase(collectionName) + "_" + name);
  }

  generateI18NName() {
    return _.toLower(_.snakeCase(this.collectionName));
  }

  /**
   * The list for i18n fields for forms, lists, and everything
   */
  generateI18NFieldsAsJSON(): string {
    const i18nSignatures = [
      ...this.studioCollection
        .getFlattenedFields()
        .map((field) => field.getI18NSignature()),
      ...this.studioCollection.relations.map((relation) =>
        relation.getI18NSignature()
      ),
    ];

    const obj = {};
    i18nSignatures.forEach((i18nSignature) => {
      obj[i18nSignature.key] = i18nSignature.label;
      if (i18nSignature.description) {
        obj[i18nSignature.key + "_description"] = i18nSignature.description;
      }
    });

    return JSON.stringify(obj);
  }

  collectionHasMode(mode: UIModeType) {
    return this.studioCollection.ui && this.studioCollection.ui[mode];
  }

  fieldHasMode(field: Studio.Field, mode: UIModeType) {
    return field.ui && field.ui[mode];
  }

  generateComponentName(name: string) {
    return this.collectionName + _.upperFirst(name);
  }

  antColumnsString() {
    return JSON.stringify(this.antColumns());
  }

  /**
   * Helper method for handlebars
   * @param type
   * @param othertype
   */
  typeIs(type, othertype) {
    return type === othertype;
  }

  /**
   * @param value
   * @returns
   */
  isUndefined(value) {
    return value === undefined;
  }

  typeIsFormPrimitive(type: RendererType) {
    const primitives = [
      Studio.Field.Types.STRING,
      Studio.Field.Types.BOOLEAN,
      Studio.Field.Types.DATE,
      Studio.Field.Types.OBJECT_ID,
      Studio.Field.Types.INTEGER,
      Studio.Field.Types.FLOAT,
      "number",
    ];

    return primitives.includes(type);
  }

  collectionClassNamesOfInterest(): string[] {
    const names = this.studioCollection.relations
      .filter((r) => !r.isFileRelated())
      .map((relation) => {
        // AppFiles are handled separately not imported directly.
        return relation.cleaned.to.id + "Collection";
      });

    names.push(this.collectionClass);

    function onlyUnique(value, index, self) {
      return self.indexOf(value) === index;
    }

    return names.filter(onlyUnique);
  }

  cssClass(name: string) {
    return `page-${_.kebabCase(this.collectionName)}-${name}`;
  }

  antColumns(mode: UIModeType = "list"): ViewItemModel[] {
    const result = [];

    this.studioCollection.fields.map((field) => {
      // Here it can be relational and fields should be in.
      this.fillFields(result, field, mode);
    });
    this.studioCollection.relations.forEach((r) => {
      if (this.isForm(mode)) {
        if (!r.isDirect) {
          // cancel execution
          return;
        }
      }
      this.fillRelations(result, r, mode);
    });

    return result;
  }

  fillRelations(
    store: ViewItemModel[],
    _relation: Studio.Relation,
    mode: UIModeType
  ) {
    const relation = _relation.cleaned;
    if (relation.ui === false) {
      return;
    }
    if (!relation.ui[mode]) {
      return;
    }

    // Sanity-check
    // You cannot add or modify relationships from an indirect one because the update is done on the other collection
    if (this.isForm(mode)) {
      if (!relation.isDirect) {
        throw new Error(
          `(${this.studioCollection.id}:${relation.id}) Relations which are inversed cannot be inside the forms.`
        );
      }
    }

    store.push({
      id: this.isForm(mode) ? relation.field.id : relation.id,
      title: this.getI18NKey(_relation),
      description: this.getI18NKey(_relation, true),
      required: relation.field && relation.field.isRequired,
      order: relation.ui.order,
      dataIndexStr: this.isForm(mode)
        ? `[ "${relation.field.id}" ]`
        : `[ "${relation.id}" ]`,
      key: relation.id,
      isMany: relation.isMany,
      sorter: true,
      remoteField: relation.representedBy.id,
      routeName: this.generateRouteNameForCollection(relation.to.id, "view"),
      relational: true,
      remoteCollectionClass: relation.to.id + "Collection",
      rendererType: this.getRendererTypeForRelation(_relation),
    });
  }

  fillFields(
    store: ViewItemModel[],
    field: Studio.Field,
    mode: UIModeType,
    dataIndexParent?: string
  ): void {
    // This refers to how ant prefers rendering items
    let dataIndexStr = `[ ${dataIndexParent ? `"${dataIndexParent}", ` : ""} "${
      field.id
    }" ]`;

    if (this.fieldHasMode(field, mode) === false) {
      return;
    }

    if (field.ui === false) {
      return;
    }

    const base: ViewItemModel = {
      id: `${field.id}`,
      dataIndexStr,
      required: field.isRequired,
      order: field.ui && field.ui.order,
      title: this.getI18NKey(field),
      description: this.getI18NKey(field, true),
      key: field.id,
      isMany: field.isArray,
      sorter: true,
      rendererType: this.getRendererType(field),
      enumValues: this.getEnumValuesLabels(
        field.enumValues as EnumConfigType[]
      ),
      defaultValue: ModelUtils.getDefaultValue(
        XBridge.fieldToGenericField(field)
      ),
    };

    if (field.ui.form) {
      base.form = {
        component: field.ui.form.component,
        props: JSON.stringify(field.ui.form.props),
      };
    }

    let subfields = field.model ? field.cleaned.model.fields : field.subfields;
    if (!subfields) {
      subfields = [];
    }

    // TODO: maybe run the check against it being an object
    if (subfields.length > 0) {
      if (!this.isForm(mode)) {
        // LIST/VIEW MODE
        if (field.isArray) {
          store.push(base);
        } else {
          // We spread it and add the other fields, since it's an object
          subfields.forEach((subfield) => {
            if (subfield.ui !== false && subfield.ui[mode]) {
              store.push(
                Object.assign({}, base, {
                  id: `${field.id}.${subfield.id}`,
                  isMany: subfield.isArray,
                  title: this.getI18NKey(subfield),
                  description: this.getI18NKey(subfield, true),
                  required: subfield.isRequired,
                  order: subfield.ui && subfield.ui.order,
                  dataIndexStr: `["${field.id}", "${subfield.id}"]`,
                  rendererType: this.getRendererType(subfield),
                  enumValues: this.getEnumValuesLabels(
                    subfield.enumValues as EnumConfigType[]
                  ),
                })
              );
            }
          });
        }
      } else {
        // FORM MODE CREATE/EDIT
        store.push(
          Object.assign({}, base, {
            subfields: subfields.map((subfield: Field) => {
              return Object.assign({}, base, {
                id: subfield.id,
                isMany: subfield.isArray,
                required: subfield.isRequired,
                order: subfield.ui && subfield.ui.order,
                title: this.getI18NKey(subfield),
                description: this.getI18NKey(subfield, true),
                dataIndexStr: `["${field.id}", "${subfield.id}"]`,
                rendererType: this.getRendererType(subfield),
                enumValues: this.getEnumValuesLabels(
                  subfield.enumValues as EnumConfigType[]
                ),
              });
            }),
          })
        );
      }
    } else {
      // check sanity
      if (this.isForm(mode)) {
        if (field.isRelationStorageField || field.isReducer) {
          throw new Error(
            `(${this.studioCollection.id}:${field.id}) You cannot add a relational storage field or a reducer to the ui components: "edit" nor "create", for relations use the relation's ui options for their presence. Reducers are derived from existing data so they cannot belong in forms.`
          );
        }
      }

      store.push(base);
    }
  }

  getI18NKey(element: Field | Relation, isDescription = false): string | null {
    let label = `management.${this.generateI18NName()}.fields.`;
    label += element.getI18NSignature().key;

    if (!element.description && isDescription) {
      return null;
    }
    if (isDescription) {
      return (label += "_description");
    }

    return label;
  }

  protected getEnumValuesLabels(values: EnumConfigType[]) {
    return values.map((enumElement) => {
      return {
        label: enumElement.label,
        value: enumElement.value,
      };
    });
  }

  protected isForm(mode: UIModeType) {
    return ["edit", "create", "listFilters"].includes(mode);
  }

  protected getRendererType(field: Field): RendererType {
    if (["integer", "float"].includes(field.type)) {
      return "number";
    }

    return field.type;
  }

  protected getRendererTypeForRelation(_relation: Relation): RendererType {
    const relation = _relation.cleaned;
    if (relation.to.id === "AppFiles" && !relation.isMany) {
      return "file";
    }
    if (relation.to.id === "AppFiles" && relation.isMany) {
      return "files";
    }
    if (relation.to.id === "AppFileGroups") {
      return "fileGroup";
    }

    return "relation";
  }
}
