import { EJSON } from "@bluelibs/ejson";

/**
 * Exports a list of top level fields that have been changed and returns only the set that needs to be sent
 * @param old
 * @param update
 */
export function getChangedSet(old, update): { [key: string]: any } {
  const final: any = {};
  for (const key in update) {
    if (update[key] === old[key]) {
      continue;
    }

    if (old[key] === null || old[key] === undefined) {
      if (update[key]) {
        final[key] = update[key];
        continue;
      }
    }

    if (typeof update[key] === "object" && typeof old[key] === "object") {
      if (!EJSON.equals(update[key], old[key])) {
        final[key] = update[key];
      }
      continue;
    }

    if (update[key] !== old[key]) {
      final[key] = update[key];
    }
  }

  return final;
}
