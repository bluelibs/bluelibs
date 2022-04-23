import { Constructor } from "@bluelibs/core";
import { Collection, ObjectID } from "@bluelibs/mongo-bundle";
import { ReadStream } from "fs";
import { AppFilesCollection } from "./collections/appFiles/AppFiles.collection";
import { AppFileGroupsCollection } from "./collections/appFileGroups/AppFileGroups.collection";
import { ResizeOptions } from "sharp";
import "@bluelibs/mongo-bundle";
import { IStoreUploadService } from "./services/IStoreUploadService";
import { IUploadService } from "./services/IUploadService";
import { S3Service } from "./services/StoreServices/S3Service";
import { LocalService } from "./services/StoreServices/LocalService";
import { DbService } from "./services/StoreServices/DbService";
import { AzureStorageService } from "./services/StoreServices/AzureStorageService";

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
  stores?: IStoreUploadService[];
  uploadService: Constructor<IUploadService>;
  prepareStores: (
    config: XS3BundleConfigType,
    container: any
  ) => XS3BundleConfigType;
  defaultStore?: IStoreUploadService;
  /**
   * Please use the s3 config variable
   * @deprecated
   */
  accessKeyId: string;
  /**
   * Thumbs information, whether to generate thumbs for uploaded images. By default it generates: "small", "medium", "large"
   * If you override this the defaults will be wiped out you will have to customise them yourself.
   */
  thumbs: ThumbConfigType[];

  appFilesCollection?: Constructor<AppFilesCollection>;
  appFileGroupsCollection?: Constructor<AppFileGroupsCollection>;
} & XS3BundleDeprecated;

export type XS3BundleDeprecated = {
  /**
   * Please use the s3 config variable
   * @deprecated
   */
  secretAccessKey: string;

  /**
   * Please use the s3 config variable
   * @deprecated
   */
  region: string;

  /**
   * Please use the s3 config variable
   * @deprecated
   */
  bucket: string;
  /**
   * Please use the s3 config variable
   * @deprecated
   */
  endpoint: string;
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
export type AzureStorageConfig = {
  connectionId: string;
  containerName: string;
  endpoint: string;
};

export type LocalStorageConfig = {
  localStoragePath: string;
  downloadUrl: string;
  downloadHandler?: (container: any, req: any, res: any) => Promise<void>;
};

export type DBStorageConfig = {
  //appFiles: AppFilesCollection;
  downloadUrl: string;
  downloadHandler?: (container: any, req: any, res: any) => Promise<void>;
};

export type UploadCredentials =
  | AWSS3Config
  | LocalStorageConfig
  | DBStorageConfig
  | AzureStorageConfig
  | any;

export type StoreConfig = {
  id: string;
  credentials: UploadCredentials;
  default?: boolean;
  thumbs?: ThumbConfigType[];
};

export const Stores = {
  S3: S3Service,
  Local: LocalService,
  Database: DbService,
  Azure: AzureStorageService,
};
