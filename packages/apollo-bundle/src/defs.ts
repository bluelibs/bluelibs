import { ApolloServerExpressConfig } from "apollo-server-express";
import * as express from "express";
import { ExecutionParams } from "subscriptions-transport-ws";
import { ContainerInstance } from "@bluelibs/core";
import { UploadOptions } from "graphql-upload";
export interface IApolloBundleConfig {
  port?: number;
  url?: string;
  apollo?: ApolloServerExpressConfig;
  enableSubscriptions?: boolean;
  middlewares?: any[];
  routes?: IRouteType[];
  uploads?: false | UploadOptions;
}

export interface IRouteType {
  type: "post" | "get" | "put" | "all";
  path: string;
  handler: (
    container: ContainerInstance,
    req: express.Request,
    res: express.Response,
    next: any
  ) => Promise<any>;
}

export interface IGraphQLContext {
  req: express.Request;
  res: express.Response;
  connection?: ExecutionParams;
  container: ContainerInstance;
  /**
   * Connection Parameters from Websocket
   */
  connectionParams: {
    [key: string]: any;
  };
}
