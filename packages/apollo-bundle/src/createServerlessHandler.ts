import { Kernel } from "@bluelibs/core";
import { Callback, Context, Handler } from "aws-lambda";
import { ApolloBundle } from "./ApolloBundle";

export function createServerlessHandler(kernel: Kernel): Handler {
  return async (event: any, context: Context, callback: Callback) => {
    if (!kernel.isInitialised()) {
      await kernel.init();
    }

    const serverlessHandler = kernel.get(ApolloBundle).serverlessHandler;

    return serverlessHandler(
      event.httpMethod === "GET"
        ? { ...event, path: event.requestContext.path || event.path }
        : event,
      context,
      callback
    );
  };
}
