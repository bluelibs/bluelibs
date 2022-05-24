import * as _ from "lodash";
import { Collection } from "./Collection";
import { DeepPartial, Resolved } from "../defs";
import { Field } from "./Field";
import { SharedModel } from "./SharedModel";
import { collection } from "../factories";

export class BaseModel<T = null> {
  app: App;
  id: string;
  /**
   * Describe the model, the field, the collection or the relation
   */
  description?: string;

  blend(data?: DeepPartial<T>) {
    _.merge(this, data);
  }

  find = {
    collection: (id: string): Collection => {
      return this.app.collections.find((c) => c.id === id);
    },

    field: (collectionId: string, id: string): Field => {
      const collection = this.find.collection(collectionId);
      const ids = id.split(".");
      let f: Field;
      for (let fieldId of ids) {
        f = (f ? f.subfields : collection.fields).find((f) => f.id === fieldId);
      }

      return f;
    },

    model: (id: string): SharedModel => {
      return this.app.sharedModels.find((c) => c.id === id);
    },
  };

  protected resolve<T extends object>(
    element: string | T | (() => T),
    finder: (id?: string) => T
  ): T {
    if (typeof element === "string") {
      let result = finder(element);
      if (!result) {
        throw new Error(
          `We could not resolve: "${element}" inside ${this.constructor?.name} "${this.id}". Please make sure it exists.`
        );
      }

      return result;
    }
    if (typeof element === "function") {
      return (element as Function)();
    }
    return element;
  }

  clean() {}

  get cleaned(): Resolved<T> {
    return this as unknown as Resolved<T>;
  }

  // This triggers the following error at Field:
  // TypeError: Class extends value undefined is not a constructor or null

  // /**
  //  * This is done to allow using data as JSON or objects not necessarily through factories.
  //  *
  //  * @param array
  //  * @param constructor
  //  * @returns
  //  */
  // protected instanceify<T extends BaseModel<any> = any>(
  //   array: T[],
  //   constructor: { new (...args: any[]): T }
  // ): any[] {
  //   return array.map((element) => {
  //     if (element instanceof constructor) {
  //       return element;
  //     }
  //     // Most likely it's an object
  //     const newElement = new constructor();
  //     newElement.blend(element);
  //   });
  // }
}

export type UICRUDConfigType = {
  label?: string;
  list?: boolean;
  edit?: boolean;
  create?: boolean;
  view?: boolean;
};

export const UICRUDConfigDetails = {
  label: "",
  list: true,
  edit: true,
  create: true,
  view: true,
};

export class App extends BaseModel<App> {
  /**
   * The name of your app
   */
  id: string;
  collections: Collection[] = [];
  sharedModels: Array<SharedModel> = [];
  /**
   * Whether the default routing of collections in ui-admin will be dynamic loaded
   */
  uiDynamicLoading: boolean = false;

  clean() {
    this.app = this;
    // this.collections = this.instanceify(this.collections, Collection);
    // this.sharedModels = this.instanceify(this.sharedModels, SharedModel);

    if (!this.find.collection("AppFiles")) {
      this.addFileCollections();
    }

    this.sharedModels.forEach((sharedModel) => {
      sharedModel.app = this;
      sharedModel.clean();
    });

    this.collections.forEach((c) => {
      if (c.uiDynamicLoading === undefined)
        c.uiDynamicLoading = this.uiDynamicLoading;
      c.app = this;
      c.clean();
    });
  }

  /**
   * Adding virtual collections for file handling
   * TODO: a bit to business-logicky to add here?
   */
  addFileCollections() {
    this.collections.push(
      collection({
        id: "AppFiles",
        externalPackage: "@bluelibs/x-s3-bundle",
        ui: false,
      })
    );
    this.collections.push(
      collection({
        id: "AppFileGroups",
        externalPackage: "@bluelibs/x-s3-bundle",
        ui: false,
      })
    );
  }
}
