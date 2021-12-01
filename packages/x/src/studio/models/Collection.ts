import { Field } from "./Field";
import { Relation } from "./Relation";
import { BaseModel } from "./App";
import * as _ from "lodash";
import * as Inflected from "inflected";
import {
  UIConfigType,
  UIModeType,
  UICollectionConfigType,
  Resolvable,
} from "../defs";

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
   * When other collections relate to this, we need a toString() version of this collection document.
   * This can be a field reducer or an actual field, like "fullName" for `User`, or "name" for `Project`
   */
  representedBy: Resolvable<Field>;

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
   * Whether this collection is something users can see and we expose it as a Type
   */
  enableGraphQL:
    | boolean
    | {
        crud?: boolean;
        entity?: boolean;
      } = true;

  /**
   * Mocking information, how many should we generate. Keep in mind that if you put 0 and the collection has relations
   * and other collections are related to this, you can still have documents created
   */
  mock = {
    count: 0,
  };

  clean() {
    // this.fields = this.instanceify(this.fields, Field);
    // this.relations = this.instanceify(this.relations, Relation);

    // ensure an entity name
    if (!this.entityName) {
      this.entityName = _.upperFirst(Inflected.singularize(this.id));
    }

    if (this.representedBy) {
      this.representedBy = this.resolve(this.representedBy, (id) =>
        this.find.field(this.id, id)
      );
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
    this.enableGraphQLCleaning();
  }

  protected enableGraphQLCleaning() {
    if (typeof this.enableGraphQL === "boolean") {
      const value = this.enableGraphQL;
      this.enableGraphQL = {
        crud: value,
        entity: value,
      };
    } else {
      ["crud", "entity"].forEach((type) => {
        if (this.enableGraphQL[type] === undefined) {
          this.enableGraphQL[type] = true;
        }
      });
    }
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
   * Gets all fields and subfields in a flatten fashion
   * @returns
   */
  public getFlattenedFields(): Field[] {
    const fields = [];
    this.fields.forEach((field) => {
      fields.push(...field.getSelfAndAllNestedFields());
    });

    return fields;
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

  getMongoCollectionName() {
    return _.camelCase(this.id);
  }

  /**
   * This checks whether the collection has exposure to graphql, and if so, to what degree.
   *
   * @param type
   * @returns
   */
  hasGraphQL(type: "crud" | "entity") {
    if (typeof this.enableGraphQL === "boolean") {
      return this.enableGraphQL;
    } else {
      return this.enableGraphQL[type];
    }
  }
}
