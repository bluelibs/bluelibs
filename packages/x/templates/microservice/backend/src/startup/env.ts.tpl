import { config } from "dotenv";
import { KernelContext } from "@bluelibs/core";
import * as fs from "fs";

const path = process.env.NODE_ENV === "test" ? ".env.test" : ".env";

if (fs.existsSync(path)) {
  const result = config({
    path,
  });

  if (result.error) {
    console.error(result.error);
    process.exit(0);
  }
} else {
  console.warn(`There is no "${path}" enviornment variable file.`);
}

export default {
  APP_URL: process.env.APP_URL,
  ROOT_URL: process.env.ROOT_URL,
  ROOT_PORT: parseInt(process.env.PORT || process.env.ROOT_PORT),
  MONGO_URL: process.env.MONGO_URL,
  CONTEXT: (process.env.NODE_ENV as KernelContext) || KernelContext.DEVELOPMENT,
  {{# if hasUploads }}
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_BUCKET: process.env.AWS_BUCKET,
    AWS_REGION: process.env.AWS_REGION,
    AWS_ENDPOINT: process.env.AWS_ENDPOINT,
  {{/ if }}
};
