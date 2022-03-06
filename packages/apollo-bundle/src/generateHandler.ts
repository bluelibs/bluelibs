import { Kernel } from "@bluelibs/core";
import { APOLLO_BUNDLE } from "./constants";
import { Callback, Context } from "aws-lambda";

export const generateHandler = (
  kernel: Kernel,
  event: any,
  context: Context,
  callback: Callback
) => {
  kernel.container
    .get(APOLLO_BUNDLE)
    .createServerlessHandler()
    .then((hand) =>
      hand(
        event.httpMethod === "GET"
          ? { ...event, path: event.requestContext.path || event.path }
          : event,
        context,
        callback
      )
    )
    .catch((err) => {
      console.log(err);
    });
};
