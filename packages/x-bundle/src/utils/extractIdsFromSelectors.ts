import { ObjectID } from "@bluelibs/mongo-bundle";

export function extractIdsFromSelectors(selector): any[] {
  const filter = selector._id;
  const ids = [];

  if (typeof filter === "object" && !ObjectID.isValid(filter)) {
    if (!filter.$in) {
      throw new Error(
        `When you subscribe directly, you can't have other specified fields rather than $in`
      );
    }
  } else {
    ids.push(filter);
  }

  return ids;
}
