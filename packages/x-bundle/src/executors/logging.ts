import { Constructor } from "@bluelibs/core";
import { LoggerService, LogLevel } from "@bluelibs/logger-bundle";
import { getResult } from "@bluelibs/graphql-bundle";

/**
 * Logs information about the request: arguments, userId
 */
export function LogRequest() {
  return async function (_, args, ctx, ast) {
    const logger: LoggerService = ctx.container.get(LoggerService);

    logger.info("Received GraphQL Request", {
      arguments: args,
      userId: ctx.userId,
    });
  };
}

/**
 * This refers to the fact that we are going to JSON.stringify the response
 * because sometimes console.log trims if the results are too deep
 */
export function LogRequestJSON() {
  return async function (_, args, ctx, ast) {
    const logger: LoggerService = ctx.container.get(LoggerService);

    logger.info(
      `Received GraphQL Request: \n ${JSON.stringify(
        { arguments: args, userId: ctx.userId },
        null,
        2
      )}`
    );
  };
}

/**
 * Logs the response with the result as log's context
 */
export function LogResponse() {
  return async function (_, args, ctx, ast) {
    const logger: LoggerService = ctx.container.get(LoggerService);

    const result = getResult(args);
    logger.info(`Sending GraphQL Response`, { result });

    return result;
  };
}

/**
 * Logs the current result in a JSON.stringified manner
 */
export function LogResponseJSON() {
  return async function (_, args, ctx, ast) {
    const logger: LoggerService = ctx.container.get(LoggerService);

    const result = getResult(args);
    logger.info(
      `Sending GraphQL Response: \n ${JSON.stringify({ result }, null, 4)}`
    );

    return result;
  };
}
