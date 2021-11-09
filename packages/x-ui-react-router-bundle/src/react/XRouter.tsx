import { Service } from "@bluelibs/core";
import {
  AddRoutingArguments,
  IRoute,
  IRouteGenerationProps,
  IRouteParams,
  XCoreRouter,
} from "@bluelibs/x-ui-router";

import { RouteProps } from "react-router-dom";
import * as H from "history";
import { createBrowserHistory } from "history";

export interface IReactRoute<T = IRouteParams, Q = IRouteParams>
  extends IRoute<T, Q>,
    Omit<RouteProps, "path"> {
  path: string;
}

@Service()
export class XRouter extends XCoreRouter<IReactRoute> {
  history: H.History;

  constructor() {
    super();
    this.history = createBrowserHistory();
  }

  go<T extends IRouteParams, Q extends IRouteParams>(
    route: IReactRoute<T, Q>,
    options?: IRouteGenerationProps<T, Q>
  ): void {
    this.history.push(this.path(route, options));
  }
}
