import { Bundle, EventManager } from "@bluelibs/core";
import { UISessionService } from "./react/services/UISession.service";
import { UI_SESSION_BUNDLE_CONFIG_TOKEN } from "./constants";
import { IXUISessionBundleConfigType } from "./defs";

export class XUISessionBundle extends Bundle<IXUISessionBundleConfigType> {
  protected defaultConfig = {} as IXUISessionBundleConfigType;

  async prepare() {
    this.container.set(UI_SESSION_BUNDLE_CONFIG_TOKEN, this.config);
    this.warmup([UISessionService]);
  }
}
