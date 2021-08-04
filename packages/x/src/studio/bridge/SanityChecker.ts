import * as Studio from "../../studio";
import { FieldValueKind } from "../../studio";
import { COLLECTION_UI_MODES_REQUIRES_FIELDS } from "../defs";

export class SanityChecker {
  constructor(protected readonly app: Studio.App) {}

  check() {
    this.app.collections.forEach((collection) =>
      this.checkCollection(collection)
    );
  }

  checkCollection(collection: Studio.Collection) {
    if (collection.ui) {
      // if the mode is enabled for a ui mode
      // but there are no fields to display throw an error and instruct to cancel it at collection level
      for (const mode of COLLECTION_UI_MODES_REQUIRES_FIELDS) {
        if (collection.ui[mode]) {
          const fields = collection.fields.filter((f) => f.ui && f.ui[mode]);
          if (fields.length === 0) {
            throw new Error(
              `Collection: ${collection.id} has no fields which are in UI "${mode}" mode. As a safety precaution please disable this mode from the collection itself.`
            );
          }
        }
      }
    }

    if (collection.fields.length === 0 && !collection.isExternal()) {
      throw new Error(
        `Collection: ${collection.id} has no fields added. Only collections from external packages can have an empty field list, as they are virtual`
      );
    }

    collection.fields.forEach((field) => this.checkField(field));
  }

  checkField(field: Studio.Field) {
    if (field.type === FieldValueKind.ENUM) {
      if (!field.enumValues || field.enumValues.length === 0) {
        throw new Error(
          `You cannot have an enum for field: ${field.id} with no values. "enumValues" option has to be provided`
        );
      }
    }
  }
}
