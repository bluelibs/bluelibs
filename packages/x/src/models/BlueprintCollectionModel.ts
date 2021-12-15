import * as _ from "lodash";

export class BlueprintCollectionModel {
  collections: string;

  get formattedCollections() {
    return this.collections
      .split(",")
      .map((s) => s.trim())
      .map((s) => _.upperFirst(s));
  }
}
