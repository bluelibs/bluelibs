import { Field } from "./Field";
import { BaseModel } from "./App";
import * as _ from "lodash";
import { Resolvable, UIConfigType } from "../defs";

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
  representedBy?: Resolvable<Field>;

  /**
   * Whether this collection is something users can see
   */
  enableGraphQL: boolean = true;

  /**
   * Default UI Configuration for this model
   */
  ui: UIConfigType;

  clean() {
    this.storeUIDefaults();
    this.fields.forEach((f) => {
      f.app = this.app;
      f.clean();
    });
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
}
