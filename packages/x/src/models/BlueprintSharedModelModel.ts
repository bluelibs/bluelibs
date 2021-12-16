import * as _ from "lodash";

export class BlueprintSharedModelModel {
  names: string;
  isEnum: boolean = false;

  get formattedNames() {
    return this.names
      .split(",")
      .map((s) => s.trim())
      .map((s) => _.upperFirst(s));
  }
}
