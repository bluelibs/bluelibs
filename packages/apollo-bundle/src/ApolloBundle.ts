import { ApolloServer, ApolloServerOptions } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import {
  handlers,
  startServerAndCreateLambdaHandler,
} from "@as-integrations/aws-lambda";
import {
  Bundle,
  EventManager,
  Exception,
  KernelAfterInitEvent,
} from "@bluelibs/core";
import { ISchemaResult, Loader } from "@bluelibs/graphql-bundle";
import { LoggerService } from "@bluelibs/logger-bundle";
import { makeExecutableSchema } from "@graphql-tools/schema";
import * as bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { GraphQLError, GraphQLFormattedError } from "graphql";
import { useServer } from "graphql-ws/lib/use/ws";
import * as http from "http";
import { inspect } from "node:util";
import { WebSocketServer } from "ws";
import { ApolloBundleConfigType, IRouteType } from "./defs";
import {
  ApolloServerAfterInitEvent,
  ApolloServerBeforeInitEvent,
  WebSocketOnConnectEvent,
  WebSocketOnDisconnectEvent,
} from "./events";
import GraphQLUpload from "./graphql-upload/GraphQLUpload";
import graphqlUploadExpress from "./graphql-upload/graphqlUploadExpress";
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
    serverless: false,
  };

  public httpServer: http.Server;
  public app: express.Application;
  public server: ApolloServer;
  public subscriptionServer: WebSocketServer;
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
    this.httpServer = http.createServer(this.app);
    const { enableSubscriptions } = this.config;

    if (this.config.serverless) {
      await this.createServerlessHandler();
    } else {
      // Hand in the schema we just created and have the
      // WebSocketServer start listening.
      let serverCleanup;
      if (enableSubscriptions) {
        this.attachSubscriptionService(apolloServerConfig, this.httpServer);

        serverCleanup = useServer(
          {
            schema: apolloServerConfig.schema,
            context: this.createContext(this.currentSchema.contextReducers),
          },
          this.subscriptionServer
        );
      }

      this.server = new ApolloServer({
        ...apolloServerConfig,
        plugins: [
          ApolloServerPluginDrainHttpServer({
            httpServer: this.httpServer,
          }),
          // Proper shutdown for the WebSocket server.
          {
            async serverWillStart() {
              return {
                async drainServer() {
                  enableSubscriptions && (await serverCleanup.dispose());
                },
              };
            },
          },
        ],
      });
    }

    await this.prepareApolloServer(
      apolloServerConfig,
      this.server,
      this.httpServer
    );

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
    apolloServer: ApolloServer,
    httpServer: http.Server
  ) {
    const manager = this.container.get(EventManager);
    const { app } = this;

    if (this.config.uploads !== false) {
      app.use("/graphql", graphqlUploadExpress(this.config.uploads));
    }

    if (!this.config.serverless) {
      await apolloServer.start();

      app.use(
        "/graphql",
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
        formatError: (
          formattedError: GraphQLFormattedError,
          error: unknown
        ) => {
          this.printError(error).catch();

          if (error instanceof Exception) {
            return {
              message: error.getMessage(),
              code: error.getCode(),
              context: error.getContext(),
            };
          }

          if (error instanceof GraphQLError) {
            if (error.originalError instanceof Exception) {
              Object.assign(formattedError, {
                code: error.originalError.getCode(),
                context: error.originalError.getContext(),
              });
            }
          }

          return formattedError;
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
   * Prints the error in a nice format
   */
  protected async printError(e: unknown) {
    if (e instanceof GraphQLError) {
      const stackTrace: string[] = (e.extensions.stacktrace as any[]) || [];
      const rootPath = __dirname.split("/").slice(0, -1).join("/");
      const replacement = "";

      const stackTraceMapped = stackTrace.map((line) =>
        line.replace(rootPath, replacement)
      );

      const pathsString = e.path?.join(" -> ");

      const logCtx = `GraphQL`;
      const humanReadableTimestamp = new Date().toLocaleString();

      if (e.originalError instanceof Exception) {
        await this.logger.error(
          `${e.originalError.getMessage()} (${e.originalError.getCode()})\nPath: ${pathsString}`,
          logCtx
        );
      }

      await this.logger.error(
        `${e.extensions.code}\n${e.message}\nPath: ${pathsString}`,
        logCtx
      );

      if (stackTraceMapped.length) {
        await this.logger.error(
          `Stacktrace:\n${stackTraceMapped.join("\n")}`,
          logCtx
        );
      }

      return;
    }

    if (e instanceof Exception) {
      await this.logger.error(`${e.getMessage()} (${e.getCode()})`);
      if (e.stack) {
        await this.logger.error(`Stacktrace:\n${e.stack}`);
      }
      return;
    }

    if (e instanceof Error) {
      await this.logger.error(inspect(e));
      return;
    }

    try {
      await this.logger.error(e.toString());
    } catch {
      await this.logger.error(
        "Failed to print error. Printing raw error below."
      );
      console.error(e);
    }

    return;
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
    if (this.httpServer.listening) {
      await this.httpServer.close();
    }
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
