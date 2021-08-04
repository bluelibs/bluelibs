import { XRouter, XUIBundle } from "@bluelibs/x-ui";
import * as Routes from "./routes";
import { Bundle } from "@bluelibs/core";
import { AppGuardian } from "./services/AppGuardian";
// import * as ComponentOverrides from "./overrides";

export class UIAppBundle extends Bundle {
  async prepare() {
    const xui = this.container.get(XUIBundle);
    xui.setGuardianClass(AppGuardian);

    // In case you want to override certain components
    // xui.updateComponents(ComponentOverrides);
  }

  async init() {
    // All routes are added via the routing service
    const router = this.container.get(XRouter);
    router.add(Routes);
  }
}
