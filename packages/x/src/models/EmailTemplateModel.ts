import * as _ from "lodash";

export class EmailTemplateModel {
  bundleName: string;
  emailName: string;

  get bundleClass() {
    const propperForm = _.upperFirst(_.camelCase(this.bundleName));

    return propperForm + "Bundle";
  }
}
