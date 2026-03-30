// @ts-nocheck

import defaultProcessRequest from "./processRequest";

import { Request, Response, NextFunction } from "express";

export default function graphqlUploadExpress({
  processRequest = defaultProcessRequest,
  ...processRequestOptions
}: any = {}) {
  /**
   * [Express](https://expressjs.com) middleware that processes incoming
   * [GraphQL multipart requests](https://github.com/jaydenseric/graphql-multipart-request-spec)
   * using {@linkcode processRequest}, ignoring non multipart requests. It sets
   * the request `body` to be similar to a conventional GraphQL POST request for
   * following GraphQL middleware to consume.
   * @param {import("express").Request} request
   * @param {import("express").Response} response
   * @param {import("express").NextFunction} next
   */
  function graphqlUploadExpressMiddleware(request: Request, response: Response, next: NextFunction) {
    if (!request.is("multipart/form-data")) return next();

    const requestEnd = new Promise((resolve) => request.on("end", resolve));
    const { send } = response;

    // @ts-ignore Todo: Find a less hacky way to prevent sending a response
    // before the request has ended.
    response.send =
      /** @param {Array<unknown>} args */
      (...args: any[]) => {
        requestEnd.then(() => {
          response.send = send;
          response.send(...args);
        });
      };

    processRequest(request, response, processRequestOptions)
      .then((body: any) => {
        request.body = body;
        next();
      })
      .catch((error: any) => {
        if (error.status && error.expose) response.status(error.status);
        next(error);
      });
  }

  return graphqlUploadExpressMiddleware;
}
