import * as dot from "dot-object";

/**
 * The logic here is that if by any chance
 * @param requestBody
 * @param intersection
 */
export function intersectGraphQLBodies(
  requestBody: any,
  flattenIntersection: any
): void {
  const flattenRequest = dot.dot(requestBody);
  for (const key in flattenRequest) {
    if (!flattenIntersection[key]) {
      throw new Error(
        `Security: The request field: "${key}" is not allowed to be requested.`
      );
    }
  }
}
