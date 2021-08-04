import * as _ from "lodash";

export class CreateBundleModel {
  bundleName: string;
  containsGraphQL: boolean;
  containsServerRoutes: boolean;

  get bundleClass() {
    const propperForm = _.upperFirst(_.camelCase(this.bundleName));

    return propperForm + "Bundle";
  }
}
