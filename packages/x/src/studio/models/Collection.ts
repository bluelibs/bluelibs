import { Field } from "./Field";
import { Relation } from "./Relation";
import { BaseModel } from "./App";
import * as _ from "lodash";
import * as Inflected from "inflected";
import { UIConfigType, UIModeType, UICollectionConfigType } from "../defs";

export type BehaviorsConfig = {
  softdeletable?: boolean;
  timestampable?: boolean;
  blameable?: boolean;
  validate?: boolean;
};

export class Collection extends BaseModel<Collection> {
  /**
   * The database name (eg: Users)
   */
  id: string;

  /**
   * What does this collection do, what is its purpose?
   */
  description: string;

  /**
   * The singular form of the database name (eg: User)
   */
  entityName: string;

  /**
   * The collection of fields it contains
   */
  fields: Field[] = [];

  /**
   * Collection link and relations
   */
  relations: Relation[] = [];

  /**
   * Collections which have an external package are not written, they exist only to be able to properly link with them.
   * Basically it will get it via this syntax: import { id } from externalPackage;
   */
  externalPackage?: string;

  /**
   * Behavioral config
   */
  behaviors: BehaviorsConfig = {
    softdeletable: true,
    timestampable: true,
    blameable: true,
    validate: false,
  };

  /**
   * Whether this collection should be added in the UI Administration
   */
  ui: UICollectionConfigType = {
    label: "",
    list: true,
    edit: true,
    create: true,
    view: true,
    delete: true,
  };

  /**
   * Whether this collection is something users can see
   */
  enableGraphQL: boolean = true;

  /**
   * Mocking information, how many should we generate. Keep in mind that if you put 0 and the collection has relations
   * and other collections are related to this, you can still have documents created
   */
  mock = {
    count: 0,
  };

  clean() {
    // ensure an entity name
    if (!this.entityName) {
      this.entityName = _.upperFirst(Inflected.singularize(this.id));
    }

    // ensure there is a label
    if (this.ui !== false && !this.ui.label) {
      this.ui.label = _.startCase(this.id);
    }

    // we clean the relations first as they may update some infos on fields
    this.relations.forEach((r) => {
      r.from = this;
      r.app = this.app;
      r.clean();
    });
    this.fields.forEach((f) => {
      f.collection = this;
      f.app = this.app;
      f.clean();
    });

    this.cleanDuplicateFields();
  }

  /**
   * Returns the fields and their subfields in a flatten manner so they can be displayed
   * @param mode
   * @returns
   */
  public getFlattenFieldsByUIMode(mode: UIModeType): Field[] {
    const result: Field[] = [];
    this.fields.forEach((field) => {
      if (field.ui && field.ui[mode]) {
        result.push(field);
      }
      field.subfields.forEach((subfield) => {
        if (subfield.ui && subfield.ui[mode]) {
          result.push(field);
        }
      });
    });

    return result;
  }

  /**
   * Returns the relationships that have enabled a certain ui mode and scope
   * @param mode
   * @returns
   */
  public getRelationshipsByUIMode(mode: UIModeType): Relation[] {
    return this.relations.filter((r) => {
      return r.ui && r.ui[mode];
    });
  }

  /**
   * Whether this Collection is from an external npm package
   */
  public isExternal(): boolean {
    return Boolean(this.externalPackage);
  }

  /**
   * If we have multiple fields with the same `id`, instead of failing we only keep the latest one
   * The code can be improved performance wise
   * @returns
   */
  protected cleanDuplicateFields() {
    // if we have fields with the same id we only leave the final added one
    const fields = this.fields.reverse();
    for (const field of fields) {
      for (const searchField of this.fields) {
        if (searchField.id === field.id) {
          // if it has the same id leave the final reference
          const isDifferent = searchField !== field;
          if (isDifferent) {
            console.warn(
              `We detected multiple fields in "${this.id}" collection with field: "${field.id}". The last one added was kept.`
            );
            this.fields = this.fields.filter((s) => s !== searchField);
            return this.cleanDuplicateFields();
          }
        }
      }
    }
  }
}
