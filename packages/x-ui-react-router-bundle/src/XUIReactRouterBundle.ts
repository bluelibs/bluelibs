import { Bundle, EventManager, KernelAfterInitEvent } from "@bluelibs/core";
import { XRouter } from ".";
import { IXUIReactRouterBundleType } from "./defs";
import { RoutingPreparationEvent } from "./events";

export class XUIReactRouterBundle extends Bundle<IXUIReactRouterBundleType> {
  async prepare() {
    this.container.set(XRouter, new XRouter());
  }

  async hook() {
    const eventManager = this.container.get(EventManager);
    const router = this.container.get(XRouter);
    // After the kernel has passed through all intialisation of all bundles and all routes have been added
    // It's time to hook into them and have extensions for configuration
    eventManager.addListener(KernelAfterInitEvent, async () => {
      await eventManager.emit(
        new RoutingPreparationEvent({
          routes: router.store,
        })
      );
    });
  }
}
