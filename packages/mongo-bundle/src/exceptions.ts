import { Exception } from "@bluelibs/core";

export class MissingContextForBehaviorException extends Exception<{
  behavior: string;
  missingField?: string;
}> {
  getMessage() {
    const { behavior, missingField } = this.data;

    if (missingField) {
      return `For behavior "${behavior}" to work, context with field "${missingField}" must be provided when inserting, updating.`;
    }

    return `For behavior "${behavior}" to work, you must provide the "context" option when inserting, updating`;
  }
}

export class MissingCollectionNameException extends Exception {
  getMessage() {
    return "Please provide a name for the collection. Did you forget to specify 'static collectionName' in the class?";
  }
}

export class DocumentNotFoundException extends Exception {
  getMessage() {
    return "The document with the specified filters could not be found";
  }
}
