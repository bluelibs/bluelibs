import { Field } from "./Field";
import { BaseModel } from "./App";
import * as _ from "lodash";
import { Resolvable, UIConfigType } from "../defs";
import { Fixturizer } from "../bridge/Fixturizer";
import { EnumConfigType } from "../../models";

/**
 * This model will be written under models?
 */
export class SharedModel extends BaseModel<SharedModel> {
  /**
   * The model name (eg: User)
   */
  id: string;

  /**
   * What does this model do, what is its purpose?
   */
  description: string;

  /**
   * The collection of fields it contains
   */
  fields: Field[];

  /**
   * By which field it's going to be represented?
   */
  representedBy?: Resolvable<Field | Field[]>;

  /**
   * Whether this collection is something users can see
   */
  enableGraphQL: boolean = true;

  /**
   * Default UI Configuration for this model
   */
  ui: UIConfigType | false = false;

  /**
   * This only applies to fields which have `FieldValueType.ENUM`
   * @cleaned is only EnumConfigType
   */
  enumValues: string[] | EnumConfigType[] = [];

  isEnum() {
    return this.enumValues.length > 0;
  }

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

  clean() {
    this.storeUIDefaults();
    if (this.isEnum()) {
      this.cleanEnums();
    } else {
      this.fields.forEach((f) => {
        f.app = this.app;
        f.clean();
      });
    }
  }

  protected storeUIDefaults() {
    if (this.ui === false) {
      return;
    }

    this.ui = Object.assign(
      {},
      {
        edit: true,
        create: true,
        list: true,
        listFilters: true,
        view: true,
      },
      this.ui
    );

    if (!this.ui.label) {
      this.ui.label = _.startCase(this.id);
    }
  }

  /**
   * Processes the enums and cleans them
   */
  protected cleanEnums() {
    if (this.enumValues && this.enumValues.length) {
      if (typeof this.enumValues[0] === "string") {
        this.enumValues = this.enumValues.map((enumElement) => {
          return {
            id: enumElement,
            value: enumElement,
            label: _.startCase(_.toLower(enumElement.id)),
          };
        });
      } else {
        (this.enumValues as EnumConfigType[]).forEach((enumElement) => {
          if (!enumElement.value) {
            enumElement.value = enumElement.id;
          }
          if (!enumElement.label) {
            enumElement.label = _.startCase(_.toLower(enumElement.id));
          }
        });
      }
    }
  }
}
