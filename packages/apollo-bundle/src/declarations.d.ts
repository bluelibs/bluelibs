declare module "cookie-parser" {
  import { RequestHandler } from "express";
  function cookieParser(
    secret?: string | string[],
    options?: any
  ): RequestHandler;
  export = cookieParser;
}

declare module "cors" {
  import { RequestHandler } from "express";
  function cors(options?: any): RequestHandler;
  export = cors;
}

declare module "graphql-upload/GraphQLUpload.mjs" {
  const GraphQLUpload: any;
  export default GraphQLUpload;
}

declare module "graphql-upload" {
  export const GraphQLUpload: any;
  export function processRequest(...args: any[]): any;
}
