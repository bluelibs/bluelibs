import * as _ from "lodash";

export class BlueprintSharedModelModel {
  names: string;

  get formattedNames() {
    return this.names
      .split(",")
      .map((s) => s.trim())
      .map((s) => _.upperFirst(s));
  }
}
