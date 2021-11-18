import { Bundle, EventManager } from "@bluelibs/core";
import { UISessionService } from ".";
import { UI_SESSION_BUNDLE_CONFIG_TOKEN } from "./constants";
import { IUISessionBundleConfigType } from "./defs";

export class UISessionBundle extends Bundle<IUISessionBundleConfigType> {
  protected defaultConfig = {} as IUISessionBundleConfigType;

  async prepare() {
    this.container.set(UI_SESSION_BUNDLE_CONFIG_TOKEN, this.config);
  }
}
