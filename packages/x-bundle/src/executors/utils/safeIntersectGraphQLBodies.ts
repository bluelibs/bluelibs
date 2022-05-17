import * as dot from "dot-object";

/**
 * The logic here is that if by any chance
 * @param requestBody
 * @param intersection
 */
export function safeIntersectGraphQLBodies(
  requestBody: any,
  flattenIntersection: any
): any {
  const flattenRequest = dot.dot(requestBody);
  for (const key in flattenRequest) {
    if (!flattenIntersection[key]) {
      delete flattenRequest[key];
    } else if (
      Object.keys(flattenRequest[key]).length &&
      Object.keys(flattenIntersection[key]).length
    ) {
      flattenRequest[key] = safeIntersectGraphQLBodies(
        flattenRequest[key],
        flattenIntersection[key]
      );
    }
  }
  return flattenRequest;
}
