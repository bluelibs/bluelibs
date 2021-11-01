import {
  AddRoutingArguments,
  IRoute,
  IRouteGenerationProps,
  IRouteParams,
  XCoreRouter,
} from "@bluelibs/x-ui-router";

import * as queryString from "query-string";

import NextRouter from "next/router";
import { Service } from "@bluelibs/core";

@Service()
export class XNextRouter extends XCoreRouter {
  store: IRoute[] = [];

  private nextRouter = NextRouter;

  add(routes: AddRoutingArguments): void {
    for (const routeName in routes) {
      const route = {
        exact: true,
        name: routeName,
        ...routes[routeName],
      };
      this.checkRouteConsistency(route);
      this.store.push(route);
    }
  }

  find(routeNameOrPath: string): IRoute<IRouteParams, IRouteParams> {
    const found = this.store.find((r) => r.path === routeNameOrPath);

    if (found) {
      return found;
    }

    return this.store.find((r) => r.name === routeNameOrPath);
  }

  path<T extends IRouteParams, Q extends IRouteParams>(
    route: IRoute<T, Q>,
    options?: IRouteGenerationProps<T, Q>
  ): string {
    let finalPath = route.path;
    let queryPath = "";

    if (options?.params) {
      for (const key in options.params) {
        if (finalPath.indexOf(`:${key}`) > -1) {
          finalPath = finalPath.replace(
            `:${key}`,
            options.params[key] as string
          );
        } else {
          throw new Error(
            `Parameter "${key}" does not exist in the route path definition.`
          );
        }
      }

      if (options?.query && Object.keys(options.query).length) {
        queryPath = queryString.stringify(options.query);
      }
    }

    return finalPath + queryPath;
  }

  go<T extends IRouteParams, Q extends IRouteParams>(
    route: IRoute<T, Q>,
    options?: IRouteGenerationProps<T, Q>
  ): void {
    this.nextRouter.push(this.path(route, options));
  }

  checkRouteConsistency(route: IRoute) {
    // Ensure that there isn't another route with the same path or name
    const found = this.store.find((r) => {
      if (r.path === route.path) {
        return r;
      }
      // Name can often be null
      if (route.name && r.name === route.name) {
        return r;
      }
    });

    if (!found) {
      return;
    }

    const foundString = JSON.stringify(found);

    throw new Error(
      `We cannot add the route: ${route.name}:${route.path} because there's another route has the same name or path: ${foundString}`
    );
  }
}
