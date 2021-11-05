import { Bundle, EventManager } from "@bluelibs/core";
import { UISessionService } from ".";
import { IUISessionBundleConfigType } from "./defs";

export class UISessionBundle extends Bundle<IUISessionBundleConfigType> {
  protected defaultConfig = {
    localStorageKey: "bluelibs-ui-session",
  } as IUISessionBundleConfigType;

  async prepare() {
    const eventManager = this.container.get(EventManager);

    this.container.set(
      UISessionService,
      new UISessionService(eventManager, this.config)
    );
  }
}
