import { Service } from "@bluelibs/core";
import {
  AddRoutingArguments,
  IRoute as IBaseRoute,
  IRouteGenerationProps,
  IRouteParams,
  XCoreRouter,
} from "@bluelibs/x-ui-router";

import { RouteProps } from "react-router-dom";
import * as H from "history";
import { createBrowserHistory } from "history";

export interface IRoute<T = IRouteParams, Q = IRouteParams>
  extends IBaseRoute<T, Q>,
    Omit<RouteProps, "path"> {
  path: string;
}

@Service()
export class XRouter extends XCoreRouter<IRoute> {
  history: H.History;

  constructor() {
    super();
    this.history = createBrowserHistory();
  }

  go<T extends IRouteParams, Q extends IRouteParams>(
    route: IRoute<T, Q>,
    options?: IRouteGenerationProps<T, Q>
  ): void {
    this.history.push(this.path(route, options));
  }
}
