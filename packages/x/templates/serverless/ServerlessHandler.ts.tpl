import "./env";
import { kernel as BaseKernel } from "./kernel";
import "./bundles";
import { Kernel } from "@bluelibs/core";
import { Callback, Context, Handler } from "aws-lambda";
import { generateHandler } from "@bluelibs/apollo-bundle";

let kernel: Kernel;
async function generateApp(): Promise<Kernel> {
  try {
    if (!kernel) {
      kernel = BaseKernel;
      await kernel.init();
    }
    return kernel;
  } catch (err) {
    console.log(err);
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
