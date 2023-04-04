import {
  Bundle,
  KernelAfterInitEvent,
  EventManager,
  Exception,
} from "@bluelibs/core";
import { Loader, ISchemaResult } from "@bluelibs/graphql-bundle";
import * as http from "http";
import express from "express";
import cookieParser from "cookie-parser";
import { ApolloServer, ApolloServerOptions } from "@apollo/server";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import {
  ApolloServerAfterInitEvent,
  ApolloServerBeforeInitEvent,
  WebSocketOnConnectEvent,
  WebSocketOnDisconnectEvent,
} from "./events";
import { ApolloBundleConfigType } from "./defs";
import {
  startServerAndCreateLambdaHandler,
  handlers,
} from "@as-integrations/aws-lambda";

import { IRouteType } from "./defs";
import { LoggerService } from "@bluelibs/logger-bundle";
import GraphQLUpload from "./graphql-upload/GraphQLUpload";
import graphqlUploadExpress from "./graphql-upload/graphqlUploadExpress";
import { GraphQLError } from "graphql";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { SubscriptionServer } from "subscriptions-transport-ws";
import { jitSchemaExecutor } from "./utils/jitSchemaExecutor";
import { expressMiddleware } from "@apollo/server/express4";
import * as bodyParser from "body-parser";
import cors from "cors";

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
    serverless: false,
  };

  public httpServer: http.Server;
  public app: express.Application;
  public server: ApolloServer;
  public subscriptionServer: SubscriptionServer;
  /**
   * This is used to creating the serverless handler
   */
  public serverlessHandler: any;
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

    // JIT works fine when the same dataset is being loaded, for serverless it just becomes too much
    if (this.config.serverless) {
      this.config.jit = false;
    }
    this.logger = this.get<LoggerService>(LoggerService);
  }

  async init() {
    await this.instantiateExpress();

    const manager = this.get<EventManager>(EventManager);

    manager.addListener(KernelAfterInitEvent, async () => {
      this.storeSchema();
      await this.setupApolloServer();
      const logger = this.container.get(LoggerService);
      if (this.config.serverless) {
        logger.info(`Serverless Apollo handler ready.`);
      } else {
        logger.info(`HTTP Server listening on port: ${this.config.port}`);
        let url = this.config.url;
        url += url.endsWith("/") ? "graphql" : "/graphql";
        logger.info(`GraphQL endpoint ready: ${url}`);
      }
    });
  }

  /**
   * Creates the config, initialises the server and starts it.
   */
  private async setupApolloServer() {
    const apolloServerConfig = this.getApolloConfig();

    if (this.config.serverless) {
      await this.createServerlessHandler();
    } else {
      this.server = new ApolloServer(apolloServerConfig);
    }

    await this.prepareApolloServer(apolloServerConfig, this.server);

    if (!this.config.serverless) {
      await this.startHTTPServer();
    }
  }

  async createServerlessHandler() {
    if (this.serverlessHandler) {
      return this.serverlessHandler;
    }

    if (this.config.serverless) {
      const apolloConfig = this.getApolloConfig();

      this.server = new ApolloServer(apolloConfig);
      this.serverlessHandler = startServerAndCreateLambdaHandler(
        this.server,
        // We will be using the Proxy V2 handler
        handlers.createAPIGatewayProxyEventV2RequestHandler()
      );
    }
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
  protected async startHTTPServer(): Promise<void> {
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

    for (const middleware of this.config.middlewares) {
      app.use.apply(app, Array.isArray(middleware) ? middleware : [middleware]);
    }

    this.app = app;
  }

  /**
   * This function purely initialises the server
   */
  protected async prepareApolloServer(
    apolloServerConfig: ApolloServerOptions<any>,
    apolloServer: ApolloServer
  ) {
    const manager = this.container.get(EventManager);
    const { app } = this;

    if (this.config.uploads !== false) {
      app.use("/graphql", graphqlUploadExpress(this.config.uploads));
    }

    let httpServer: http.Server;
    if (!this.config.serverless) {
      httpServer = http.createServer(app);

      if (this.config.enableSubscriptions) {
        // apolloServer.
        this.attachSubscriptionService(apolloServerConfig, httpServer);
      }

      this.httpServer = httpServer;

      await apolloServer.start();

      app.use(
        "/",
        cors<cors.CorsRequest>(),
        bodyParser.json(),
        // expressMiddleware accepts the same arguments:
        // an Apollo Server instance and optional configuration options
        expressMiddleware(apolloServer, {
          context: this.createContext(this.currentSchema.contextReducers),
        })
      );
    }

    this.addRoutesToExpress();

    await manager.emit(
      new ApolloServerBeforeInitEvent({
        app,
        httpServer,
        server: apolloServer,
      })
    );
  }

  private addRoutesToExpress() {
    if (this.config.routes) {
      this.config.routes.forEach((route) => {
        this.addRoute(route);
      });
    }
  }

  private attachSubscriptionService(
    apolloServerConfig: ApolloServerOptions<any>,
    httpServer: http.Server
  ) {
    this.subscriptionServer = new WebSocketServer({
      // This is the `httpServer` we created in a previous step.
      server: httpServer,
      // Pass a different path here if app.use
      // serves expressMiddleware at a different path
      path: "/graphql",

      // Providing `onConnect` is the `SubscriptionServer` equivalent to the
      // `context` function in `ApolloServer`. Please [see the docs](https://github.com/apollographql/subscriptions-transport-ws#constructoroptions-socketoptions--socketserver)
      // for more information on this hook.
      // ...this.createSubscriptions(apolloServerConfig.c)
      ...this.createSubscriptions(this.currentSchema.contextReducers),
    });

    // Hand in the schema we just created and have the
    // WebSocketServer start listening.
    const serverCleanup = useServer(
      { schema: apolloServerConfig.schema },
      this.subscriptionServer
    );
  }

  /**
   * Returns the ApolloConfiguration for ApolloServer
   */
  protected getApolloConfig(): ApolloServerOptions<any> {
    const schema = makeExecutableSchema({
      typeDefs: this.currentSchema.typeDefs,
      resolvers: this.currentSchema.resolvers,
    });

    const config: ApolloServerOptions<any> = Object.assign(
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
