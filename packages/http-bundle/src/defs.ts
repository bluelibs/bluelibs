import { ContainerInstance } from "@bluelibs/core";
import * as express from "express";

export const RouteHandlerPreviousResultStore = Symbol(
  "RouteHandler_PreviousResultStore"
);
export type HTTPBundleConfigType = {
  port?: number;
  useApolloBundleHttp?: boolean;
};

export type RouteHandlerType = (
  container: ContainerInstance,
  req: express.Request,
  res: express.Response,
  next: any
) => any;

export type RouteType = {
  type: "post" | "get" | "put" | "patch" | "delete" | "all";
  path: string;
  handler: RouteHandlerType | RouteHandlerType[];
};
