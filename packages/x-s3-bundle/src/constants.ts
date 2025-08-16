import { Token } from "@bluelibs/core";
import { Collection } from "@bluelibs/mongo-bundle";
import { AWSS3Config, XS3BundleConfigType } from "./defs";
import { AppFileGroupsCollection } from "./collections/appFileGroups/AppFileGroups.collection";
import { AppFilesCollection } from "./collections/appFiles/AppFiles.collection";

export const APP_FILES_COLLECTION_TOKEN = new Token<AppFilesCollection>(
  "X_S3_BUNDLE::APP_FILES_COLLECTION"
);
export const APP_FILE_GROUPS_COLLECTION_TOKEN =
  new Token<AppFileGroupsCollection>("X_S3_BUNDLE::APP_FILE_GROUPS_COLLECTION");

export const X_S3_CONFIG_TOKEN = new Token<XS3BundleConfigType>(
  "X_S3_BUNDLE::AWS_MAIN_CONFIG_TOKEN"
);
