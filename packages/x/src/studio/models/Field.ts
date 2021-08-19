import { FieldValueKind } from "./FieldValueKind";
import { BaseModel } from "./App";
import { Collection } from "./Collection";
import { ObjectId } from "@bluelibs/ejson";
import * as faker from "faker";
import { IGenericFieldSubModel } from "../../models";
import { Cleanable, Resolvable, UIConfigType, UIModeConfigType } from "../defs";
import * as _ from "lodash";
import { Fixturizer } from "../bridge/Fixturizer";
import { SharedModel } from "./SharedModel";

const UI_DEFAULT_VALUES = {
  label: "",
  list: true,
  listFilters: true,
  create: true,
  edit: true,
  view: true,
};
export class Field extends BaseModel<Field> {
  static Types = FieldValueKind;

  /**
   * The scalar type of the field
   */
  type: FieldValueKind;

  /**
   * Variable name
   */
  id: string;

  /**
   * This is a mandatory field that must exist
   */
  isRequired: boolean = false;

  /**
   * Whether the element is alone or an array
   */
  isArray: boolean = false;

  /**
   * If it's an object and has subfields then it's an embeddable
   */
  subfields: Field[] = [];

  /**
   * This only applies to fields which have `FieldValueType.ENUM`
   */
  enumValues: string[] = [];

  /**
   * This says that this field is virtual and most likely depends on other fields to be ran
   * @unavailable
   */
  isReducer: boolean = false;

  /**
   * If it's a reducer, state on which fields does it depend
   * @unavailable
   */
  reducerDependency: { [key: string]: 1 } = {};

  /**
   * If this is a field where we store relationships
   * @autohandled
   */
  isRelationStorageField: boolean = false;

  /**
   * Whether this field is something users can access or is visible only in database
   */
  enableGraphQL: boolean = true;

  /**
   * This refers to an Studio Model, that is designed to work as a piece of re-usable code in your app
   * Model will translate as subfields when rendering the generated code.
   */
  model?: Resolvable<SharedModel>;

  /**
   * This refers to a custom submodel implementation that works with IGenericFieldSubmodel
   */
  genericFieldSubmodel: IGenericFieldSubModel;

  /**
   * What does this field do, what is its purpose?
   */
  description: string;

  /**
   * Mock info how to generate the field in a custom fashion. Keep in mind this won't work with when `isRelationStorageField` is true
   */
  mock = {
    generator: null,
    /**
     * This only applies to subfields
     */
    minCount: 0,
    maxCount: 0,
  };

  /**
   * Whether to show this field in the UI List, Create and Edit Forms
   */
  ui: UIConfigType;

  /**
   * The collection it belongs to. This is stored automatically you don't have to specify it.
   * @cleanable
   */
  collection: Collection;

  /**
   * Parent field in case it's a subfield
   */
  parent?: Field;

  clean() {
    this.storeUIDefaults();
    // this.subfields = this.instanceify(this.subfields, Field);

    if (!this.mock.generator) {
      this.mock.generator = Fixturizer.getRandomGenerator(this);
    }

    if (this.model) {
      this.model = this.resolve(this.model, (id) => this.find.model(id));
    }

    // To avoid any errors we upper case all
    if (this.enumValues && this.enumValues.length) {
      this.enumValues = this.enumValues.map((ev) => _.toUpper(ev));
    }

    this.subfields.forEach((s) => {
      s.app = this.app;
      s.collection = this.collection;
      s.parent = this;
      s.clean();
    });
  }

  protected storeUIDefaults() {
    if (this.ui === false) {
      return;
    }

    this.ui = Object.assign({}, this.getUIDefaults(), this.ui);

    if (!this.ui.label) {
      this.ui.label = _.startCase(this.id);
    }
  }

  /**
   * Defaults based on whether it's an id, a reducer or a relation field
   * @returns
   */
  protected getUIDefaults(): UIModeConfigType {
    if (this.id === "_id") {
      return {
        list: false,
        listFilters: false,
        view: true,
        create: false,
        edit: false,
      };
    }

    if (this.isReducer) {
      return {
        list: true,
        listFilters: false,
        view: true,
        create: false,
        edit: false,
      };
    }

    // Typically this is handled through the relation, not through the field
    if (this.isRelationStorageField) {
      return {
        list: false,
        listFilters: false,
        view: false,
        create: false,
        edit: false,
      };
    }

    return UI_DEFAULT_VALUES;
  }

  /**
   * This method verifies if there is any direct child that has UI enabled
   * It intentionally does not go deeper, because we don't support that yet
   * @param uiMode
   * @returns
   */
  someSubfieldsHaveUI(uiMode?: "list" | "edit" | "create" | "view") {
    return this.subfields.some((subfield) => {
      if (uiMode) {
        return subfield.ui && subfield.ui[uiMode];
      } else {
        return subfield.ui !== false;
      }
    });
  }

  /**
   * Depending on whether this field is a model or has subfields it will return the list of subfields it's got
   */
  getSelfAndAllNestedFields(): Field[] {
    const fields: Field[] = [this];

    if (this.model) {
      this.cleaned.model.fields.forEach((field) => {
        fields.push(...field.getSelfAndAllNestedFields());
      });
    } else if (this.subfields.length) {
      this.subfields.forEach((field) => {
        fields.push(...field.getSelfAndAllNestedFields());
      });
    }

    return fields;
  }

  /**
   * Gets the i18n signature (key, label) based on what the information about it should be
   *
   * @returns
   */
  getI18NSignature(): { key: string; label: string; description?: string } {
    const parents: Field[] = [];
    let current: Field = this;

    while (current.parent) {
      parents.push(current.parent);
      if (!current.parent) {
        break;
      } else {
        current = current.parent;
      }
    }

    const label = this.ui ? this.ui.label : this.id;
    if (parents.length === 0) {
      return { key: this.id, label, description: this.description };
    }

    let keySignature = "";
    let labelSignature = "";
    parents.reverse().forEach((field) => {
      keySignature = keySignature + field.id + ".";
      labelSignature = labelSignature + field.getLabel() + " — ";
    });

    return {
      key: keySignature + this.id,
      label: labelSignature + label,
      description: this.description,
    };
  }

  /**
   * @returns a label for the field whether it has ui or not.
   */
  getLabel(): string {
    if (this.ui) {
      return this.ui.label || this.id;
    }

    return this.id;
  }
}
