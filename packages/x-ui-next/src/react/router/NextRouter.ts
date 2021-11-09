import {
  AddRoutingArguments,
  IRoute,
  IRouteGenerationProps,
  IRouteParams,
  XCoreRouter,
} from "@bluelibs/x-ui-router";

import NextRouter from "next/router";
import { Service } from "@bluelibs/core";

@Service()
export class XNextRouter extends XCoreRouter {
  private nextRouter = NextRouter;

  go<T extends IRouteParams, Q extends IRouteParams>(
    route: IRoute<T, Q>,
    options?: IRouteGenerationProps<T, Q>
  ): void {
    this.nextRouter.push(this.path(route, options));
  }
}
