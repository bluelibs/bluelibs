import { Collection } from "@bluelibs/mongo-bundle";
import { ICronEntry } from "../defs";

export class CronsCollection extends Collection<ICronEntry> {
  static collectionName = "crons";

  static indexes = [
    {
      key: {
        intendedAt: 1,
        name: 1,
      },
      unique: true,
    },
  ];
}
