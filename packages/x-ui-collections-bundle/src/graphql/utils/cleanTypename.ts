import { QueryBodyType } from "../defs";

/**
 * Cleans typename if it was not specifically requested inside the body.
 * @mutates
 * @param document
 */
export function cleanTypename(document: any, body: QueryBodyType) {
  if (!document) {
    return;
  }
  if (Array.isArray(document)) {
    return document.forEach((d) => cleanTypename(d, body));
  }
  if (typeof document !== "object") {
    return;
  }

  if (typeof body === "object") {
    if (!body["__typename"]) {
      delete document["__typename"];
    }
  } else {
    delete document["__typename"];
  }

  for (const key in document) {
    if (typeof document[key] === "object") {
      cleanTypename(document[key], body[key] as QueryBodyType);
    }
  }
}
