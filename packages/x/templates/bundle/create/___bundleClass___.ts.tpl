import { BaseBundle } from "@bluelibs/x-bundle";
import * as listeners from "./listeners";
import * as collections from "./collections";
import * as validators from "./validators";
import * as fixtures from "./fixtures";

{{# if containsGraphQL }}
  import graphqlModule from './graphql';
{{/ if }}

{{# if containsServerRoutes }}
  import { ApolloBundle } from "@bluelibs/apollo-bundle";
  import * as serverRoutes from "./server-routes";
{{/ if }}

export class {{ bundleClass }} extends BaseBundle<any> {
  async prepare() {
    this.setupBundle({
      listeners,
      collections,
      validators,
      fixtures,
      {{# if containsGraphQL }}
        graphqlModule,
      {{/ if }}
    });

    {{# if containsServerRoutes }}
      // Adding server routes
      const apolloBundle = this.container.get<ApolloBundle>(ApolloBundle);
      Object.values(serverRoutes).filter(v => Boolean(v)).forEach(
        (serverRoute) => apolloBundle.addRoute(serverRoute)
      );
    {{/ if }}
  }
}