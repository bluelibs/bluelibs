import "./env";
import { kernel } from "./kernel";
import "./bundles";
import { Kernel } from "@bluelibs/core";
import { Callback, Context, Handler } from "aws-lambda";
import { generateHandler } from "@bluelibs/apollo-bundle";

let isInitialised = false;
async function generateApp(): Promise<Kernel> {
  try {
    if (!isInitialised) {
      await kernel.init();
      isInitialised = true;
    }
    return kernel;
  } catch (err) {
    console.log("kernel error init : ", err);
    process.exit(0);
  }
}

export const graphqlHandler: Handler = async (
  event: any,
  context: Context,
  callback: Callback
) => {
  return generateHandler(await generateApp(), event, context, callback);
};
