import {
  Bundle,
  KernelAfterInitEvent,
  EventManager,
  Kernel,
  Exception,
} from "@bluelibs/core";
import { Loader, IResolverMap, ISchemaResult } from "@bluelibs/graphql-bundle";
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
import { ApolloBundleConfigType } from "./defs";
import { IRouteType } from "./defs";
import { LoggerService } from "@bluelibs/logger-bundle";
import { GraphQLUpload, graphqlUploadExpress } from "graphql-upload";
import { GraphQLError, execute, subscribe } from "graphql";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { SubscriptionServer } from "subscriptions-transport-ws";
import { jitSchemaExecutor } from "./utils/jitSchemaExecutor";
export class ApolloBundle extends Bundle<ApolloBundleConfigType> {
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
    jit: true,
    useJSONMiddleware: true,
  };

  public httpServer: http.Server;
  public app: express.Application;
  public server: ApolloServer;
  public subscriptionServer: SubscriptionServer;
  protected logger: LoggerService;
  protected currentSchema: ISchemaResult;

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
      this.storeSchema();
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
    await this.startServer();
  }

  protected storeSchema() {
    const loader = this.container.get(Loader);

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

    this.currentSchema = loader.getSchema();
  }

  /**
   * Starts the http server listening process
   */
  protected async startServer(): Promise<void> {
    const { app, httpServer, server } = this;
    const manager = this.get<EventManager>(EventManager);

    // server starting
    return new Promise((resolve) => {
      httpServer.listen(this.config.port, async () => {
        resolve();
        await manager.emit(
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
      express.urlencoded({ extended: true })
    );

    if (this.config.useJSONMiddleware) {
      app.use(express.json());
    }

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

    const httpServer = http.createServer(app);

    if (this.config.enableSubscriptions) {
      // apolloServer.
      this.attachSubscriptionService(apolloServerConfig, httpServer);
    }

    this.app = app;
    this.httpServer = httpServer;
    this.server = apolloServer;

    if (this.config.routes) {
      this.config.routes.forEach((route) => {
        this.addRoute(route);
      });
    }

    await apolloServer.start();
    apolloServer.applyMiddleware({ app });

    await manager.emit(
      new ApolloServerBeforeInitEvent({
        app,
        httpServer,
        server: apolloServer,
      })
    );
  }

  private attachSubscriptionService(
    apolloServerConfig: ApolloServerExpressConfig,
    httpServer: http.Server
  ) {
    this.subscriptionServer = SubscriptionServer.create(
      {
        // This is the `schema` we just created.
        schema: apolloServerConfig.schema,
        // These are imported from `graphql`.
        execute,
        subscribe,
        // Providing `onConnect` is the `SubscriptionServer` equivalent to the
        // `context` function in `ApolloServer`. Please [see the docs](https://github.com/apollographql/subscriptions-transport-ws#constructoroptions-socketoptions--socketserver)
        // for more information on this hook.
        // ...this.createSubscriptions(apolloServerConfig.c)
        ...this.createSubscriptions(this.currentSchema.contextReducers),
      },
      {
        // This is the `httpServer` we created in a previous step.
        server: httpServer,
        // This `server` is the instance returned from `new ApolloServer`.
        path: "/graphql",
      }
    );
  }

  /**
   * Returns the ApolloConfiguration for ApolloServer
   */
  protected getApolloConfig(): ApolloServerExpressConfig {
    const schema = makeExecutableSchema({
      typeDefs: this.currentSchema.typeDefs,
      resolvers: this.currentSchema.resolvers,
    });

    const config: ApolloServerExpressConfig = Object.assign(
      {
        cors: true,
        formatError: (e: GraphQLError) => {
          this.logger.error(JSON.stringify(e, null, 4));

          if (e instanceof Exception) {
            return {
              message: e.getMessage(),
              code: e.getCode(),
              context: e.getContext(),
            };
          }

          const response = {
            message: e.message,
            path: e.path,
          };

          if (e.originalError instanceof Exception) {
            Object.assign(response, {
              code: e.originalError.getCode(),
              context: e.originalError.getContext(),
            });
          }

          return response;
        },
      },
      this.config.apollo,
      {
        schema,
        executor: this.config.jit ? jitSchemaExecutor(schema) : undefined,
        context: this.createContext(this.currentSchema.contextReducers),
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
    if (this.subscriptionServer) {
      this.subscriptionServer.close();
    }
    await this.server.stop();
    await this.httpServer.close();
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
