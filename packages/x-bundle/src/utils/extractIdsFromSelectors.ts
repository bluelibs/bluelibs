import { ObjectID } from "@bluelibs/mongo-bundle";
import { IDType } from "../defs";

export function extractIdsFromSelectors(selector: { _id?: unknown }): IDType[] {
  const filter = selector._id;
  const ids: IDType[] = [];

  if (
    typeof filter === "object" &&
    !ObjectID.isValid(filter) &&
    filter?.constructor?.name !== "ObjectId"
  ) {
    if (!(filter as { $in?: unknown }).$in) {
      console.log({ filter });
      throw new Error(
        `When you subscribe directly, you can't have other specified fields rather than $in`
      );
    }
  } else {
    ids.push(filter as IDType);
  }

  return ids;
}
