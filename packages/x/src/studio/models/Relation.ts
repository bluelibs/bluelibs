import { BaseModel } from "./App";
import { Collection } from "./Collection";
import { Resolvable, UIConfigType } from "../defs";
import { Field } from "./Field";
import * as _ from "lodash";
import { field as fieldFactory, collection } from "../factories";
export class Relation extends BaseModel<Relation> {
  /**
   * This represents the id of the relation, how is it named
   */
  id: string;

  /**
   * The collection is comming from. Stored after clean()
   * @cleanable
   */
  from: Collection;

  /**
   * Relates to a collection or a collection id
   */
  to: Resolvable<Collection>;

  /**
   * The relation is stored in the collection from which the relations[] is defined
   */
  isDirect: boolean;

  /**
   * Single or many relationships
   */
  isMany: boolean = false;

  /**
   * Whether it's isDirect, and by which field is it inversed
   */
  inversedBy: string;

  /**
   * If it's an indirect link, specifying unique lets Nova know that when we fetch this link, it should return one result
   */
  unique: string;

  /**
   * If it's direct in which field are we actually storing the relational data
   * Keep in mind that this field should be in the fields: [] as well
   * @cleanable
   */
  field: Resolvable<Field>;

  /**
   * This refers to the field that is represented by the collection
   * For example, if I have Post relating to User, user is represented by "fullName"
   * @cleanable
   */
  representedBy: Resolvable<Field>;

  /**
   * Mocking information, how many should we generate?
   */
  mock: {
    /**
     * How many relations to have. If it's -> 1, then clearly you cannot have more than 1
     */
    maxCount?: number;
    /**
     * You can use this to force at least one relation. If it's ->1, then saying 1 is saying you always have 1
     */
    minCount?: number;
    /**
     * Create additional documents or use existing ones from the database?
     */
    useExistingDocuments?: boolean;
  } = {};

  /**
   * Whether or not to put this relation into the GraphQL layer
   */
  enableGraphQL: boolean = true;

  /**
   * UI Display Config
   */
  ui: UIConfigType;

  /**
   * What does this relation do, what is its purpose?
   */
  description: string;

  /**
   * Whether this relation must be present and is present
   */
  isRequired: boolean = true;

  /**
   * Returns the opposite relation object (if it exists, if it's direct it might not)
   */
  get reversedRelation(): Relation {
    const $this = this.cleaned;
    if (this.isDirect) {
      return $this.to.relations.find((r) => r.inversedBy === this.id);
    } else {
      return $this.to.relations.find((r) => r.id === this.inversedBy);
    }
  }

  clean() {
    if (!this.inversedBy || this.field) {
      this.isDirect = true;
    }

    if (this.inversedBy) {
      this.isDirect = false;
    }

    if (this.isDirect) {
      if (!this.field) {
        // If no field has been specified we automatically add and infer it
        this.field = fieldFactory({
          id: `${this.id}Id${this.isMany ? "s" : ""}`,
          type: fieldFactory.types.OBJECT_ID,
          isArray: this.isMany,
        });
      } else {
        this.field = this.resolve(this.field, (id) =>
          this.find.field(this.from.id, id)
        );
      }

      // Ensure it's marked as a relational stored field
      this.field.isRelationStorageField = true;

      // Basically if the user created the field while in the relation, add it to the "from" list of fields
      if (!this.find.field(this.from.id, this.field.id)) {
        this.from.fields.push(this.field);
      }
    }

    this.to = this.resolve(this.to, (id) => {
      return this.find.collection(id);
    });

    if (!this.representedBy && this.cleaned.to.representedBy) {
      // We have at Collection level a representedBy
      this.representedBy = this.cleaned.to.representedBy;
    }

    this.representedBy = this.resolve(this.representedBy, (id) => {
      return this.find.field(this.cleaned.to.id, id);
    });

    // if the field was created here add it to the parent collection
    if (
      this.isDirect &&
      this.field &&
      !this.from.fields.find((f) => {
        return f.id === (this.field as Field).id;
      })
    ) {
      this.from.fields.push(this.field as Field);
    }

    if (!this.representedBy) {
      this.representedBy = this.find.field(this.to.id, "_id");
    }

    if (this.isDirect) {
      this.cleaned.field.isRequired = this.isRequired;
    }

    this.storeUIDefaults();
  }

  public isFileRelated() {
    return ["AppFiles", "AppFileGroups"].includes(this.cleaned.to.id);
  }

  public isFileGroupRelated() {
    return this.cleaned.to.id === "AppFileGroups";
  }

  /**
   * Can be one or many to AppFiles
   */
  public isFileSimpleRelated() {
    return this.cleaned.to.id === "AppFiles";
  }

  public getI18NSignature() {
    return {
      key: this.id,
      label: this.ui ? this.ui.label : this.id,
      description: this.description,
    };
  }

  protected storeUIDefaults() {
    const $this = this.cleaned;

    if (this.ui === false) {
      return;
    }

    this.ui = Object.assign(
      {
        label: "",
        list: true,
        listFilters: true,
        view: true,
      },
      this.ui
    );

    // Automatically store it to false as we do not allow inversed relations to be present in forms
    if (!this.isDirect) {
      this.ui.create = false;
      this.ui.edit = false;
    } else {
      if (this.ui.create === undefined) this.ui.create = true;
      if (this.ui.edit === undefined) this.ui.edit = true;
    }

    if (!this.ui.label) {
      // if it doesn't have a label we check whether it's a direct link
      this.ui.label = _.startCase(this.id);
    }
  }
}
