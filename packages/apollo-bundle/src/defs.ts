import { ApolloServerOptions, BaseContext } from "@apollo/server";
import { ContainerInstance } from "@bluelibs/core";
import * as express from "express";
import { RequestHandler } from "express";
import { Context } from "graphql-ws";

// Upload options type definition (graphql-upload doesn't provide types for .mjs)
export type UploadOptions = {
  maxFieldSize?: number;
  maxFileSize?: number;
  maxFiles?: number;
};

export type ApolloBundleConfigType = {
  port?: number;
  url?: string;
  apollo?: ApolloServerOptions<BaseContext>;
  enableSubscriptions?: boolean;
  middlewares?: (RequestHandler | RequestHandler[])[];
  routes?: IRouteType[];
  uploads?: false | UploadOptions;
  /**
   * Enable JIT JSON encoding and DECODING through GraphQL
   */
  jit?: boolean;
  useJSONMiddleware?: boolean;
  //serverless
  serverless?: boolean;
};

export interface IRouteType {
  type: "post" | "get" | "put" | "all";
  path: string;
  handler: (
    container: ContainerInstance,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => Promise<unknown>;
}

export interface IGraphQLContext {
  req: express.Request;
  res: express.Response;
  connection?: Context;
  container: ContainerInstance;
  /**
   * Connection Parameters from Websocket
   */
  connectionParams: {
    [key: string]: unknown;
  };
}
