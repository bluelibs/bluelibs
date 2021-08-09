import * as _ from "lodash";
import * as Studio from "../studio";
import { Field, UIModeType } from "../studio";
import { FieldValueKind } from "../studio/models/FieldValueKind";
import { Relation } from "../studio/models/Relation";

type FilesType = "file" | "files" | "fileGroup";

type RendererType = "relation" | "number" | FilesType | FieldValueKind;

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

  hasFeature(feature: CRUDFeatureType) {
    return this.features === true || this.features[feature];
  }

  get sheetName() {
    if (this.studioCollection.ui === false) {
      throw new Error("Shouldn't generate CRUD for it");
    }

    return this.studioCollection.ui.label;
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
      if (field.model) {
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

  typeIsFormPrimitive(type: RendererType) {
    const primitives = [
      Studio.Field.Types.STRING,
      Studio.Field.Types.BOOLEAN,
      Studio.Field.Types.DATE,
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
      title: relation.ui.label,
      description: relation.description,
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

    const base: ViewItemModel = {
      id: `${field.id}`,
      dataIndexStr,
      description: field.description,
      required: field.isRequired,
      order: field.ui && field.ui.order,
      title: field.ui && field.ui.label,
      key: field.id,
      isMany: field.isArray,
      sorter: true,
      rendererType: this.getRendererType(field.type),
      enumValues: this.getEnumValuesLabels(field.enumValues),
    };

    let subfields = field.model ? field.cleaned.model.fields : field.subfields;

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
                  title: `${field.ui && field.ui.label} ${subfield.ui.label}`,
                  required: subfield.isRequired,
                  description: subfield.description,
                  order: subfield.ui && subfield.ui.order,
                  dataIndexStr: `["${field.id}", "${subfield.id}"]`,
                  rendererType: this.getRendererType(subfield.type),
                  enumValues: this.getEnumValuesLabels(subfield.enumValues),
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
              let subfieldLabel = subfield.ui && subfield.ui.label;
              if (!field.isArray) {
                subfieldLabel = `${
                  field.ui && field.ui.label
                } — ${subfieldLabel}`;
              }

              return Object.assign({}, base, {
                id: subfield.id,
                isMany: subfield.isArray,
                required: subfield.isRequired,
                description: subfield.description,
                order: subfield.ui && subfield.ui.order,
                title: subfieldLabel,
                dataIndexStr: `["${field.id}", "${subfield.id}"]`,
                rendererType: this.getRendererType(subfield.type),
                enumValues: this.getEnumValuesLabels(subfield.enumValues),
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

  protected getEnumValuesLabels(values: string[]) {
    return values.map((v) => {
      return {
        value: v,
        label: _.startCase(_.lowerCase(v)),
      };
    });
  }

  protected isForm(mode: UIModeType) {
    return ["edit", "create", "listFilters"].includes(mode);
  }

  protected getRendererType(type: FieldValueKind): RendererType {
    if (["integer", "float"].includes(type)) {
      return "number";
    }

    return type;
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
