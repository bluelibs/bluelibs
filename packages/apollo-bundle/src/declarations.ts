import { ContainerInstance } from "@bluelibs/core";
import "@bluelibs/graphql-bundle";
import * as express from "express";
import { Context } from "graphql-ws";

declare module "@bluelibs/graphql-bundle" {
  export interface IGraphQLContext {
    container: ContainerInstance;
    req: express.Request;
    res: express.Response;
    connection?: Context;
  }
}
