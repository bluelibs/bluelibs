/**
 * @mutates
 * @param document
 */
export function cleanTypename(document: any) {
  if (!document) {
    return;
  }
  if (Array.isArray(document)) {
    return document.forEach((d) => cleanTypename(d));
  }
  if (typeof document !== "object") {
    return;
  }

  delete document["__typename"];

  for (const key in document) {
    cleanTypename(document[key]);
  }
}
