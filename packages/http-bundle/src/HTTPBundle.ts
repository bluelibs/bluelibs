import {
  Bundle,
  IBundleConstructor,
  KernelAfterInitEvent,
} from "@bluelibs/core";
import {
  HTTPBundleConfigType,
  RouteType,
  RouteHandlerPreviousResultStore,
} from "./defs";
import * as express from "express";
import * as http from "http";
import { LoggerService } from "@bluelibs/logger-bundle";
import {
  ApolloBundle,
  ApolloServerAfterInitEvent,
} from "@bluelibs/apollo-bundle";
import * as cookieParser from "cookie-parser";
import {
  HTTPServerBeforeInitialisationEvent,
  HTTPServerInitialisedEvent,
} from "./events";

export class HTTPBundle extends Bundle<HTTPBundleConfigType> {
  dependencies = [ApolloBundle];
  public app: express.Application;
  public router: express.Router;
  public routes: RouteType[] = [];
  public httpServer: http.Server;
  public isInitialised: boolean = false;

  defaultConfig = {
    port: 3000,
  };

  async hook() {
    const logger = this.container.get(LoggerService);
    if (this.config.useApolloBundleHttp) {
      this.eventManager.addListener(ApolloServerAfterInitEvent, async (e) => {
        //if we depend on apollo server we wait for its init not kernel init
        await this.eventManager.emit(new HTTPServerBeforeInitialisationEvent());
        this.httpServer = this.container.get(ApolloBundle).httpServer;
        return new Promise((resolve, reject) => {
          this.addRoutesToRouter();
        });
      });
    } else {
      this.eventManager.addListener(KernelAfterInitEvent, async (e) => {
        await this.eventManager.emit(new HTTPServerBeforeInitialisationEvent());

        return new Promise((resolve, reject) => {
          this.addRoutesToRouter();

          if (!this.httpServer) {
            this.httpServer = this.app
              .listen(this.config.port, () => {
                this.isInitialised = true;
                logger.info(`Started HTTP Server on port: ${this.config.port}`);
                this.eventManager.emit(new HTTPServerInitialisedEvent());
                resolve();
              })
              .on("error", (e) => {
                reject(e);
              });
          }
        });
      });
    }
  }

  protected addRoutesToRouter() {
    this.routes.forEach((route) => {
      this.router[route.type](route.path, async (req, res, next) => {
        if (Array.isArray(route.handler)) {
          for (const handler of route.handler) {
            const result = await handler(this.container, req, res, next);
            req[RouteHandlerPreviousResultStore] = result;
          }
        } else {
          return route.handler(this.container, req, res, next);
        }
      });
    });
  }

  async prepare() {
    if (this.config.useApolloBundleHttp && this.container.get(ApolloBundle)) {
      this.app = this.container.get(ApolloBundle).app;
      this.router = this.container.get(ApolloBundle).app;
      this.app.use(cookieParser());
      this.app.use(express.json()); // for parsing application/json
      this.app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
    } else {
      this.app = express();
      this.app.use((req, res, next) => {
        res.setHeader("X-Framework", "BlueLibs");
        next();
      });
      this.app.use(cookieParser());
      this.app.use(express.json()); // for parsing application/json
      this.app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

      this.router = express.Router();
      this.app.use(this.router);
    }
  }

  async init() {}

  async shutdown() {
    this.httpServer.close();
  }

  /**
   * @param path
   * @param handler
   */
  public addRoute(route: RouteType) {
    if (this.isInitialised) {
      throw new Error(
        `You can't add routes after the server has been initialised.`
      );
    }

    this.routes.push(route);
  }

  public addRoutes(routes: RouteType[]) {
    routes.forEach((route) => this.addRoute(route));
  }
}
