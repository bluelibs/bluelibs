import { Service } from "@bluelibs/core";
import {
  AddRoutingArguments,
  IRoute,
  IRouteGenerationProps,
  IRouteParams,
  XCoreRouter,
} from "@bluelibs/x-ui-router";

import * as H from "history";
import * as queryString from "query-string";
import { createBrowserHistory } from "history";

@Service()
export class XRouter extends XCoreRouter {
  store: IRoute[] = [];
  history: H.History;

  constructor() {
    super();
    this.history = createBrowserHistory();
  }

  add(routes: AddRoutingArguments) {
    // TODO: sanity check not to add after kernel initialisation

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

  find(routeNameOrPath: string): IRoute | null {
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
    this.history.push(this.path(route, options));
  }

  /**
   * This method is used to ensure that you do not have duplicated routes
   */
  protected checkRouteConsistency(route: IRoute) {
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
