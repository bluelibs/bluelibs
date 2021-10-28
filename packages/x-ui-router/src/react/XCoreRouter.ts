import { IRoute, IRouteGenerationProps, IRouteParams } from "../defs";
import { Service } from "@bluelibs/core";

export type AddRoutingArguments = {
  [routeName: string]: IRoute;
};

@Service()
export abstract class XCoreRouter {
  abstract add(routes: AddRoutingArguments): void;

  abstract find(routeNameOrPath: string): IRoute | null;

  abstract path<T extends IRouteParams, Q extends IRouteParams>(
    route: IRoute<T, Q>,
    options?: IRouteGenerationProps<T, Q>
  ): string;

  abstract go<T extends IRouteParams, Q extends IRouteParams>(
    route: IRoute<T, Q>,
    options?: IRouteGenerationProps<T, Q>
  ): void;

  /**
   * This method is used to ensure that you do not have duplicated routes
   */
  protected checkRouteConsistency(route: IRoute) {}
}
