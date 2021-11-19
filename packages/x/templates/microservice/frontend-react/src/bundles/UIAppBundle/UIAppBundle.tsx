import { XRouter, XUIBundle } from "@bluelibs/x-ui";
import * as Routes from "./routes";
import { Bundle } from "@bluelibs/core";
import { AppGuardian } from "./services/AppGuardian";
import { i18n } from "./i18n";
// import * as ComponentOverrides from "./overrides";

export class UIAppBundle extends Bundle {
  async init() {
    // In case you want to override certain components
    // xui.updateComponents(ComponentOverrides);
    const xui = this.container.get(XUIBundle);
    xui.setGuardianClass(AppGuardian);
    xui.storeI18N(i18n);

    // All routes are added via the routing service
    const router = this.container.get(XRouter);
    router.add(Routes);
  }
}
