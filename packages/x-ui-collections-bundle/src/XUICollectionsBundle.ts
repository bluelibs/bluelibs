import { Bundle } from "@bluelibs/core";
import { UIApolloBundle } from "@bluelibs/ui-apollo-bundle";
import { IXUICollectionsBundleConfig } from "./defs";

export class XUICollectionsBundle extends Bundle<IXUICollectionsBundleConfig> {
  protected defaultConfig = {} as IXUICollectionsBundleConfig;

  async extend() {
    await this.addDependency(UIApolloBundle);
  }
}
