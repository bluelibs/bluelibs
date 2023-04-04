import { ObjectID } from "@bluelibs/mongo-bundle";

export function extractIdsFromSelectors(selector): any[] {
  const filter = selector._id;
  const ids = [];

  if (
    typeof filter === "object" &&
    !ObjectID.isValid(filter) &&
    filter?.constructor?.name !== "ObjectId"
  ) {
    if (!filter.$in) {
      console.log({ filter });
      throw new Error(
        `When you subscribe directly, you can't have other specified fields rather than $in`
      );
    }
  } else {
    ids.push(filter);
  }

  return ids;
}
