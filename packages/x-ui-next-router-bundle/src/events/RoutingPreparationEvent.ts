import { Event } from "@bluelibs/core";
import { IRoute } from "@bluelibs/x-ui-router";

export class RoutingPreparationEvent extends Event<{
  routes: IRoute[];
}> {
  getRoutes(): IRoute[] {
    return this.data.routes;
  }
}
