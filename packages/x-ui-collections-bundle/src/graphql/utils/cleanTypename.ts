import { QueryBodyType } from "../defs";

/**
 * Cleans typename if it was not specifically requested inside the body.
 * @mutates
 * @param document
 */
export function cleanTypename(document: unknown, body: QueryBodyType) {
  if (!document) {
    return;
  }
  if (Array.isArray(document)) {
    return document.forEach((d) => cleanTypename(d, body));
  }
  if (typeof document !== "object") {
    return;
  }

  const documentObj = document as Record<string, unknown>;

  if (typeof body === "object") {
    if (!body["__typename"]) {
      delete documentObj["__typename"];
    }
  } else {
    delete documentObj["__typename"];
  }

  for (const key in documentObj) {
    if (typeof documentObj[key] === "object") {
      cleanTypename(documentObj[key], body[key] as QueryBodyType);
    }
  }
}
