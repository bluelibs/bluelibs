import {
  Bundle,
  KernelAfterInitEvent,
  EventManager,
  Kernel,
  Exception,
} from "@bluelibs/core";
import { Loader, IResolverMap } from "@bluelibs/graphql-bundle";
import * as http from "http";
import * as express from "express";
import * as cookieParser from "cookie-parser";
import { ApolloServer, ApolloServerExpressConfig } from "apollo-server-express";

import {
  ApolloServerAfterInitEvent,
  ApolloServerBeforeInitEvent,
  WebSocketOnConnectEvent,
  WebSocketOnDisconnectEvent,
} from "./events";
import { IApolloBundleConfig } from "./defs";
import { IRouteType } from "./defs";
import { LoggerService } from "@bluelibs/logger-bundle";
import { GraphQLUpload, graphqlUploadExpress } from "graphql-upload";
import { GraphQLError } from "../../graphql-final/error/GraphQLError";

export class ApolloBundle extends Bundle<IApolloBundleConfig> {
  defaultConfig = {
    port: 4000,
    url: "http://localhost:4000",
    apollo: {},
    enableSubscriptions: true,
    middlewares: [],
    uploads: {
      maxFileSize: 1000000000,
      maxFiles: 10,
    },
  };

  public httpServer: http.Server;
  public app: express.Application;
  public server: ApolloServer;
  protected logger: LoggerService;

  async validate(config) {
    const keys = Object.keys(config.apollo);
    if (
      keys.includes("typeDefs") ||
      keys.includes("schemaDirectives") ||
      keys.includes("resolvers") ||
      keys.includes("subscriptions")
    ) {
      throw new Error(
        `You have to use the 'Loader' if you wish to load these into the API`
      );
    }
  }

  async prepare() {
    // We add the container to the context in the preparation phase
    // As loading should be done in initial phase and we have the container as the first reducer
    const loader = this.get<Loader>(Loader);
    this.logger = this.get<LoggerService>(LoggerService);

    await this.instantiateExpress();
  }

  async init() {
    const manager = this.get<EventManager>(EventManager);

    manager.addListener(KernelAfterInitEvent, async () => {
      await this.setupApolloServer();
      const logger = this.container.get(LoggerService);
      logger.info(`HTTP Server listening on port: ${this.config.port}`);
      let url = this.config.url;
      url += url.endsWith("/") ? "graphql" : "/graphql";
      logger.info(`GraphQL endpoint ready: ${url}`);
    });
  }

  /**
   * Creates the config, initialises the server and starts it.
   */
  private async setupApolloServer() {
    const apolloServerConfig = this.getApolloConfig();
    await this.initialiseServer(apolloServerConfig);
    return this.startServer();
  }

  /**
   * Starts the http server listening process
   */
  protected async startServer(): Promise<void> {
    const { app, httpServer, server } = this;
    const manager = this.get<EventManager>(EventManager);

    // server starting
    return new Promise((resolve) => {
      httpServer.listen(this.config.port, (data) => {
        resolve();
        manager.emit(
          new ApolloServerAfterInitEvent({
            app,
            httpServer,
            server,
          })
        );
      });
    });
  }

  protected async instantiateExpress() {
    const app = express();
    app.use(
      (req, res, next) => {
        res.setHeader("X-Framework", "BlueLibs");
        next();
      },
      cookieParser(),
      express.json(),
      express.urlencoded({ extended: true })
    );

    if (this.config.middlewares.length) {
      app.use(...this.config.middlewares);
    }

    this.app = app;
  }

  /**
   * This function purely initialises the server
   */
  protected async initialiseServer(
    apolloServerConfig: ApolloServerExpressConfig
  ) {
    const manager = this.get<EventManager>(EventManager);

    const apolloServer = new ApolloServer(apolloServerConfig);
    const { app } = this;

    if (this.config.uploads !== false) {
      app.use("/graphql", graphqlUploadExpress(this.config.uploads));
    }

    apolloServer.applyMiddleware({ app });

    const httpServer = http.createServer(app);

    if (this.config.enableSubscriptions) {
      apolloServer.installSubscriptionHandlers(httpServer);
    }

    this.app = app;
    this.httpServer = httpServer;
    this.server = apolloServer;

    if (this.config.routes) {
      this.config.routes.forEach((route) => {
        this.addRoute(route);
      });
    }

    await manager.emit(
      new ApolloServerBeforeInitEvent({
        app,
        httpServer,
        server: apolloServer,
      })
    );
  }

  /**
   * Returns the ApolloConfiguration for ApolloServer
   */
  protected getApolloConfig(): ApolloServerExpressConfig {
    const loader = this.get<Loader>(Loader);

    loader.load({
      typeDefs: `
        type Query { framework: String }
      `,
      resolvers: {
        Query: {
          framework: () => "BlueLibs",
        },
      },
    });

    if (this.config.uploads !== false) {
      loader.load({
        typeDefs: `
          scalar Upload
        `,
        resolvers: {
          Upload: GraphQLUpload,
        },
      });
    }

    const {
      typeDefs,
      resolvers,
      schemaDirectives,
      contextReducers,
    } = loader.getSchema();

    const config: ApolloServerExpressConfig = Object.assign(
      {
        cors: true,
        formatError: (e: GraphQLError) => {
          this.logger.error(JSON.stringify(e, null, 4));

          if (e instanceof Exception) {
            return {
              message: e.getMessage(),
              code: e.getCode(),
            };
          }

          const response = {
            message: e.message,
            path: e.path,
          };

          if (e.originalError instanceof Exception) {
            Object.assign(response, { code: e.originalError.getCode() });
          }

          return response;
        },
      },
      this.config.apollo,
      {
        typeDefs,
        resolvers,
        schemaDirectives,
        subscriptions: this.createSubscriptions(contextReducers),
        context: this.createContext(contextReducers),
        uploads: false,
      }
    );

    return config;
  }

  /**
   * Creates the function for handling GraphQL contexts
   */
  protected createContext(contextReducers = []) {
    const contextHandler = async (context) => {
      return await this.applyContextReducers(context, contextReducers);
    };

    return contextHandler;
  }

  /**
   * Creates the object necessary to pass `subscriptions` to apollo
   */
  protected createSubscriptions(contextReducers: any) {
    const manager = this.container.get(EventManager);

    return {
      onConnect: async (connectionParams, webSocket, context) => {
        context = await this.applyContextReducers(
          Object.assign({ connectionParams }, context),
          contextReducers
        );

        await manager.emit(
          new WebSocketOnConnectEvent({
            connectionParams,
            webSocket,
            context,
          })
        );

        return context;
      },
      onDisconnect: async (webSocket, context) => {
        await manager.emit(
          new WebSocketOnDisconnectEvent({
            webSocket,
            context,
          })
        );

        return context;
      },
    };
  }

  /**
   * Applies reducing of context
   */
  protected async applyContextReducers(context: any, reducers: any) {
    context.container = this.container;

    for (const reducer of reducers) {
      try {
        context = await reducer(context);
      } catch (e) {
        this.logger.error(`Error was found when creating context: `, e);
        throw e;
      }
    }

    return context;
  }

  /**
   * Add a middleware for express() before server initialises
   */
  public addMiddleware(middleware) {
    this.config.middlewares.push(middleware);
  }

  /**
   * Shutdown the http server so it's no longer hanging
   */
  async shutdown() {
    this.httpServer.close();
  }

  /**
   * @param path
   * @param handler
   */
  public addRoute(route: IRouteType) {
    this.app[route.type](route.path, async (req, res, next) => {
      await route.handler(this.container, req, res, next);
    });
  }
}
