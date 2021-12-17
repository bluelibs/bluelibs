import {
  IRoute,
  IRouteGenerationProps,
  IRouteParams,
  XCoreRouter,
} from "@bluelibs/x-ui-router";

import BaseNextRouter from "next/router";

import { Service } from "@bluelibs/core";

@Service()
export class XNextRouter extends XCoreRouter<IRoute> {
  get next() {
    return BaseNextRouter;
  }

  go<T extends IRouteParams, Q extends IRouteParams>(
    route: IRoute<T, Q>,
    options?: IRouteGenerationProps<T, Q>
  ): void {
    this.next.push(this.path(route, options));
  }
}
