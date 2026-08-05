import "@bluelibs/graphql-bundle";
import { UserId } from "@bluelibs/security-bundle";

declare module "@bluelibs/graphql-bundle" {
  export interface IGraphQLContext {
    /**
     * The userId retrieved from the request, when the request is authenticated.
     */
    userId?: UserId;
    /**
     * The token retrieved from either HTTP Cookies, HTTP Headers, or WebSocket
     * parameter, when the request is authenticated.
     */
    authenticationToken?: string;
  }
}
