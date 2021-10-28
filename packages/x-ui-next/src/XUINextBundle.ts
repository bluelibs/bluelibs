import { Bundle } from "@bluelibs/core";
import { XUIGuardianBundle } from "@bluelibs/x-ui-guardian-bundle";
import { XUIReactBundle } from "@bluelibs/x-ui-react-bundle";
import { IXUINextBundleType } from "./defs";
import { XNextRouter } from "./react";

export class XUINextBundle extends Bundle<IXUINextBundleType> {
  async extend() {
    await this.addDependency(XUIGuardianBundle);
    await this.addDependency(XUIReactBundle);
  }

  async prepare() {
    this.container.set(XNextRouter, new XNextRouter());
  }
}
