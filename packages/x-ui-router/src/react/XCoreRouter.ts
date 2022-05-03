import { IRoute, IRouteGenerationProps, IRouteParams } from "../defs";
import { Service } from "@bluelibs/core";
import * as queryString from "query-string";

export type AddRoutingArguments<T> = {
  [routeName: string]: T;
};

@Service()
export abstract class XCoreRouter<
  RT extends IRoute,
  RP extends IRouteParams = IRouteParams
> {
  store: RT[] = [];
  routePathPrefix: string = "";

  /**
   * Add routes in the form of { [name]: config }
   * @param routes
   */
  add(
    routes: AddRoutingArguments<RT>,
    i18nConfig: { defaultLocale: string; locales?: any[] } = {
      defaultLocale: "en",
      locales: [],
    }
  ) {
    if (i18nConfig?.locales.length) {
      this.routePathPrefix = `/:locale(${[
        ...i18nConfig?.locales.map((x) => x.locale),
        i18nConfig.defaultLocale,
      ].join("|")})?`;
    }

    for (const routeName in routes) {
      const newPath = this.routePathPrefix + routes[routeName].path;
      const route = {
        exact: true,
        name: routeName,
        ...routes[routeName],
        path: newPath,
      };
      this.checkRouteConsistency(route);
      this.store.push(route);
    }
  }

  find(routeNameOrPath: string): RT | null {
    const found = this.store.find(
      (r) => r.path === this.routePathPrefix + routeNameOrPath
    );

    if (found) {
      return found;
    }

    return this.store.find((r) => r.name === routeNameOrPath);
  }

  /**
   * Generate the path
   * @param route
   * @param options
   * @returns
   */
  path<T extends RP, Q extends RP>(
    route: IRoute<T, Q>,
    options?: IRouteGenerationProps<T, Q>
  ): string {
    let finalPath = this.find(route.path)?.path;
    let queryPath = "";

    if (this.routePathPrefix.length) {
      if (!options) options = {};
      const locale = options?.locale || route?.defaultLocale;
      if (locale) {
        options.params = {
          ...options?.params,
          locale,
        };
      }

      finalPath = finalPath.replace(
        this.routePathPrefix,
        (options.params?.locale ? "/" + options.params?.locale : "") as string
      );
    }

    if (options?.params) {
      for (const key in options.params) {
        if (key === "locale") continue;
        console.log("key", key);
        console.log("options.params", options.params);
        console.log("finalPath", finalPath);
        const keyIndex = finalPath.indexOf(`:${key}`);
        if (keyIndex > -1) {
          finalPath = finalPath.replace(
            `:${key}`,
            options.params[key] as string
          );
        } else {
          throw new Error(
            `Parameter "${key}" does not exist in the route path definition.`
          );
        }
        console.log("final final path", finalPath);
      }
    }

    if (options?.query && Object.keys(options.query).length) {
      queryPath = `?${queryString.stringify(options.query)}`;
    }

    return finalPath + queryPath;
  }

  abstract go<T extends RP, Q extends RP>(
    route: IRoute<T, Q>,
    options?: IRouteGenerationProps<T, Q>
  ): void;

  /**
   * This method is used to ensure that you do not have duplicated routes
   */
  protected checkRouteConsistency(route: RT) {
    // Ensure that there isn't another route with the same path or name
    const found = this.store.find((r) => {
      if (r.path === this.routePathPrefix + route.path) {
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
