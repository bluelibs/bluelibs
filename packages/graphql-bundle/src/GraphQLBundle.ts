import { Bundle } from "@bluelibs/core";

export class GraphQLBundle extends Bundle {
  async init() {
    // We currently do nothing here, but at a later stage, we may want to be able to override Loader and behavior of loading.
    // So we can make loading more intelligently
  }
}
