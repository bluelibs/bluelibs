import { Token } from "@bluelibs/core";
import { Collection } from "@bluelibs/mongo-bundle";
import { AWSS3Config, XS3BundleConfigType } from "./defs";
import { AppFileGroupsCollection } from "./collections/appFileGroups/AppFileGroups.collection";
import { AppFilesCollection } from "./collections/appFiles/AppFiles.collection";

export const APP_FILES_COLLECTION_TOKEN = new Token<AppFilesCollection>(
  "APP_FILES_COLLECTION"
);
export const APP_FILE_GROUPS_COLLECTION_TOKEN =
  new Token<AppFileGroupsCollection>("APP_FILE_GROUPS_COLLECTION");

export const UPLOAD_CONFIG = new Token<XS3BundleConfigType>(
  "AWS_MAIN_CONFIG_TOKEN"
);
