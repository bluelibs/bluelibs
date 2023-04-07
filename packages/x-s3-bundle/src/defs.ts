import { Constructor } from "@bluelibs/core";
import { Collection, ObjectID } from "@bluelibs/mongo-bundle";
import { ReadStream } from "fs";
import { AppFilesCollection } from "./collections/appFiles/AppFiles.collection";
import { AppFileGroupsCollection } from "./collections/appFileGroups/AppFileGroups.collection";
import { ResizeOptions } from "sharp";
import "@bluelibs/mongo-bundle";

declare module "@bluelibs/mongo-bundle" {
  interface IExecutionContext {
    /**
     * This should only be used when removing files, if true, the system won't automatically delete the files
     */
    fileDeletionProcessed?: boolean;
  }
}

export type File = {
  filename: string;
  mimetype: string;
  encoding: string;
  stream?: ReadStream;
};

export type XS3BundleConfigType = {
  s3: AWSS3Config;
  /**
   * Thumbs information, whether to generate thumbs for uploaded images. By default it generates: "small", "medium", "large"
   * If you override this the defaults will be wiped out you will have to customise them yourself.
   */
  thumbs: ThumbConfigType[];

  appFilesCollection?: Constructor<AppFilesCollection>;
  appFileGroupsCollection?: Constructor<AppFileGroupsCollection>;
};

export type ThumbConfigType = {
  id: string;
  width: number;
  height: number;
  // Generate these thumbs only for specific contexts. If empty it will work for all configs
  contexts?: string[];
  /**
   * Sharp resize options
   */
  resizeOptions?: ResizeOptions;
};

export type AWSS3Config = {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  endpoint: string;
  bucket: string;
};
