import {
  IRoute,
  IRouteGenerationProps,
  IRouteParams,
  XCoreRouter,
} from "@bluelibs/x-ui-router";

import { NextRouter } from "next/router";
import BaseNextRouter from "next/router";

import { Constructor, Service } from "@bluelibs/core";

export type XNextRouterClass = XCoreRouter<IRoute> & NextRouter;

export const XNextRouter = ((): Constructor<XNextRouterClass> => {
  @Service()
  class XNextRouterClass extends XCoreRouter<IRoute> {
    constructor() {
      super();

      Object.assign(this, BaseNextRouter.router);

      BaseNextRouter.router.events.on("routeChangeComplete", () => {
        Object.assign(this, BaseNextRouter.router);
      });
    }

    go<T extends IRouteParams, Q extends IRouteParams>(
      route: IRoute<T, Q>,
      options?: IRouteGenerationProps<T, Q>
    ): void {
      BaseNextRouter.push(this.path(route, options));
    }
  }

  return XNextRouterClass as any;
})();
