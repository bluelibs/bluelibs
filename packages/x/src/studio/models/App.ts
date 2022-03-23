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

    //return field or array of fields in case the id was nested path as 'key1.key2.key3'=>[field1,field2,field3]
    field: (collectionId: string, id: string): Field | Field[] => {
      const collection = this.find.collection(collectionId);
      let fieldsPathIds = id.split(".");
      if (fieldsPathIds.length === 1) {
        return collection.fields.find((f) => f.id === id);
      } else {
        //we wanna return all the fields that represent the path to the nested attribut field1:{subfield:[field2:{}]}
        let headField = collection.fields.find(
          (f) => f.id === fieldsPathIds[0]
        );
        let arrayFields = [headField];
        fieldsPathIds = fieldsPathIds.slice(1);
        for (let fieldId of fieldsPathIds) {
          if (headField?.subfields && headField?.subfields.length > 0) {
            let subField = headField.subfields.find((sf) => sf.id == fieldId);
            arrayFields.push(subField);
            headField = subField;
          } else break;
        }
        return arrayFields;
      }
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
