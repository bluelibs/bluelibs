import { Bundle, EventManager, KernelAfterInitEvent } from "@bluelibs/core";
import { XUII18NBundle } from "@bluelibs/x-ui-i18n-bundle";
import { XUIReactBundle } from "@bluelibs/x-ui-react-bundle";
import { XRouter } from ".";
import { IXUIReactRouterBundleType } from "./defs";
import { RoutingPreparationEvent } from "./events";
import { XBrowserRouter } from "./react/XBrowserRouter";

export class XUIReactRouterBundle extends Bundle<IXUIReactRouterBundleType> {
  async prepare() {
    // this.container.set(XRouter, new XRouter());
    this.warmup([XRouter, XUII18NBundle]);
    const xuiReactBundle = this.container.get(XUIReactBundle);

    xuiReactBundle.addWrapper({
      component: XBrowserRouter,
      props: () => ({
        router: this.container.get(XRouter),
      }),
      order: Infinity,
    });
  }

  async hook() {
    // After the kernel has passed through all intialisation of all bundles and all routes have been added
    // It's time to hook into them and have extensions for configuration
    this.eventManager.addListener(KernelAfterInitEvent, async () => {
      const router = this.container.get(XRouter);

      await this.eventManager.emit(
        new RoutingPreparationEvent({
          routes: router.store,
        })
      );
    });
  }
}
