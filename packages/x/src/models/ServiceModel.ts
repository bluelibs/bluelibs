import * as _ from "lodash";

export class ServiceModel {
  bundleName: string;
  serviceName: string;
  injectContainer: boolean;
  injectEventManager: boolean;
  methods: string; // addThis, doThat, makeThat, addAnother, markAsPaid

  get serviceClass() {
    const propperForm = _.upperFirst(_.camelCase(this.serviceName));

    return propperForm + "Service";
  }

  get methodsArray() {
    return this.methods.split(",").map((method) => method.trim());
  }
}
