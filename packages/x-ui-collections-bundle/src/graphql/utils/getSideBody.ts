import { QueryBodyType } from "../defs";

/**
 * The side body is just the body but only with arguments $
 * @param body
 */
export function getSideBody(body: QueryBodyType): QueryBodyType {
  // We deeply parse it
  const newBody: QueryBodyType = {};
  for (const key in body) {
    if (key === "$") {
      newBody.$ = body.$;
    } else {
      if (typeof body[key] === "object") {
        const sideBody = getSideBody(body[key] as QueryBodyType);
        if (Object.keys(sideBody).length > 0) {
          newBody[key] = sideBody;
        }
      }
    }
  }

  return newBody;
}

export function isSideBodyNecessary(body: QueryBodyType): boolean {
  for (const key in body) {
    if (body[key] === "$") {
      return true;
    } else {
      if (typeof body[key] === "object") {
        const isNecessary = isSideBodyNecessary(body[key] as QueryBodyType);

        if (isNecessary) {
          return true;
        }
      }
    }
  }

  return false;
}
