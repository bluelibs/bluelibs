import "@bluelibs/graphql-bundle";
import { ContainerInstance } from "@bluelibs/core";
import * as express from "express";
import { ExecutionParams } from "subscriptions-transport-ws";

declare module "@bluelibs/graphql-bundle" {
  export interface IGraphQLContext {
    container: ContainerInstance;
    req: express.Request;
    res: express.Response;
    connection?: ExecutionParams;
  }
}
