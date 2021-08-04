import { Event } from "@bluelibs/core";
import { IRoute } from "../defs";

export class RoutingPreparationEvent extends Event<{
  routes: IRoute[];
}> {
  getRoutes(): IRoute[] {
    return this.data.routes;
  }
}
