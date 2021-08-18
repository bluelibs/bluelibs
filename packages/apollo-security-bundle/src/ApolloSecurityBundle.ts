import { Bundle, EventManager, BundleAfterPrepareEvent } from "@bluelibs/core";
import { Loader, ApolloBundle, IGraphQLContext } from "@bluelibs/apollo-bundle";
import { SecurityService, SecurityBundle } from "@bluelibs/security-bundle";
import { ApolloInvalidTokenException } from "./exceptions";
import { PassportService } from "./services/PassportService";
import { IResolverMap } from "@bluelibs/graphql-bundle";

import "@bluelibs/apollo-bundle"; // To ensure the IGraphQLContext is extended

export interface IApolloSecurityBundleConfig {
  support: {
    headers?: boolean;
    cookies?: boolean;
    websocket?: boolean;
  };
  identifiers: {
    headers?: string;
    cookies?: string;
    websocket?: string;
  };
}

export class ApolloSecurityBundle extends Bundle<IApolloSecurityBundleConfig> {
  protected defaultConfig = {
    support: {
      headers: true,
      cookies: true,
      websocket: true,
    },
    identifiers: {
      headers: "bluelibs-token",
      cookies: "bluelibs-token",
      websocket: "bluelibs-token",
    },
  };

  dependencies = [SecurityBundle, ApolloBundle];

  async prepare() {
    this.loadContextReducer();
  }

  async init() {
    const passportService = this.container.get(PassportService);
    passportService.init();
  }

  loadTokenReissue() {
    const loader = this.container.get(Loader);

    loader.load({
      typeDefs: `
        type Mutation {
          reissueToken(token: String!): String!
        }
      `,
      resolvers: {
        Mutation: {
          async reissueToken(_, { token }, ctx) {
            const securityService = ctx.container.get(SecurityService);

            return securityService.reissueSessionToken(token);
          },
        },
      } as IResolverMap,
    });
  }

  loadContextReducer() {
    const loader = this.container.get(Loader);

    loader.load({
      contextReducers: async (context: IGraphQLContext) => {
        const { req, connection, container } = context;

        const token = this.identifyToken(req, connection);
        let userId = null;

        if (token === null || token === "" || token === undefined) {
          return context;
        }

        if (token) {
          const securityService: SecurityService = container.get(
            SecurityService
          );
          const session = await securityService.getSession(token);
          if (session) {
            // We check if the user still exists and is enabled
            const isEnabled = await securityService.isUserEnabled(
              session.userId
            );
            if (isEnabled) {
              userId = session.userId;
            }
          } else {
            throw new ApolloInvalidTokenException({ token });
          }
        }

        return {
          ...context,
          authenticationToken: token,
          userId,
        };
      },
    });
  }

  /**
   * Identifies the token from various places
   * @param req
   * @param connection
   */
  identifyToken(req, connection) {
    const { support, identifiers } = this.config;

    let token;
    if (connection) {
      if (support.websocket) {
        token = connection.context?.connectionParams[identifiers.websocket];
      }
    } else {
      if (req) {
        if (support.headers) {
          token = req.headers[identifiers.headers];
        }

        if (!token && support.cookies && req.cookies) {
          token = req.cookies[identifiers.cookies];
        }
      }
    }

    return token;
  }
}
