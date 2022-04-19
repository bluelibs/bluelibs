import * as fs from "fs";
import {
  DBStorageConfig,
  LocalStorageConfig,
  UploadCredentials,
} from "../../defs";
import { IStoreUploadService } from "../IStoreUploadService";
import { dirname } from "path";
import * as mkdirp from "mkdirp";

export class DbService extends IStoreUploadService {
  protected id: string;
  protected credentials: DBStorageConfig;

  constructor(id: string, credentials: UploadCredentials) {
    super(id, credentials);
    this.credentials = credentials as DBStorageConfig;
    this.id = id;
  }

  /**
   * Uploads your buffer/stream to the desired path in S3
   * @param fileKey
   * @param mimeType
   * @param stream
   * @returns
   */
  public writeFile(fileKey, mimeType, buffer) {}

  /**
   * Removes it from S3 deleting it forever
   * @param key
   * @returns
   */
  public deleteFile(key) {}

  /**
   * Returns the downloadable URL for the specified key
   *
   * @param key
   * @returns
   */
  public getDownloadUrl(key: string): string {
    return this.credentials.downloadUrl + "/" + key;
  }
}
