import { IRoute as IBaseRoute, IRouteParams } from "@bluelibs/x-ui-router";

import { RouteProps } from "react-router-dom";

export type IXUIReactRouterBundleType = {};
export interface IRoute<T = IRouteParams, Q = IRouteParams>
  extends IBaseRoute<T, Q>,
    Omit<RouteProps, "path"> {
  path: string;
}
