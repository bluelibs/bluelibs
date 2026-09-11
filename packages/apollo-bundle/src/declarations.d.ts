declare module "cookie-parser" {
  import { RequestHandler } from "express";
  function cookieParser(
    secret?: string | string[],
    options?: Record<string, unknown>
  ): RequestHandler;
  export = cookieParser;
}

declare module "cors" {
  import { RequestHandler } from "express";
  function cors(options?: Record<string, unknown>): RequestHandler;
  export = cors;
}

declare module "graphql-upload/GraphQLUpload.mjs" {
  import { GraphQLScalarType } from "graphql";
  const GraphQLUpload: GraphQLScalarType;
  export default GraphQLUpload;
}

declare module "graphql-upload" {
  import { GraphQLScalarType } from "graphql";
  export const GraphQLUpload: GraphQLScalarType;
  export function processRequest(
    request: unknown,
    response: unknown,
    options?: { maxFieldSize?: number; maxFileSize?: number; maxFiles?: number }
  ): Promise<unknown>;
}
