import * as React from "react";
import { Bundle, EventManager } from "@bluelibs/core";
import { XRouter, RoutingPreparationEvent, XUIBundle } from "@bluelibs/x-ui";
import { IXUIAdminBundleConfig } from "./defs";
import { MenuService } from "./services/MenuService";
import { DefaultComponentsMap } from "./react/components/types";
import { XForm, XViewer, XList } from "./react";
export class XUIAdminBundle extends Bundle<IXUIAdminBundleConfig> {
  defaultConfig = {
    components: DefaultComponentsMap,
  };

  async hook() {
    const eventManager = this.container.get(EventManager);
    const menuService = this.container.get(MenuService);
    const router = this.get<XRouter>(XRouter);

    eventManager.addListener(RoutingPreparationEvent, (e) => {
      e.data.routes.forEach((route) => {
        if (route.menu) {
          // Reference it for convenient access.
          route.menu.route = route;
          menuService.add(route.menu);
        }
      });
    });
  }

  async prepare() {
    const xuiBundle = this.container.get(XUIBundle);
    xuiBundle.updateComponents(this.config.components);
  }
}
