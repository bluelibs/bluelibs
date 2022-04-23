import * as fs from "fs";
import { LocalStorageConfig, StoreConfig, UploadCredentials } from "../../defs";
import { IStoreUploadService } from "../IStoreUploadService";
import { dirname } from "path";
import * as mkdirp from "mkdirp";

export class LocalService extends IStoreUploadService {
  constructor(storeConfig: StoreConfig) {
    super(storeConfig);
  }

  /**
   * Uploads your buffer/stream to the desired path in S3
   * @param fileKey
   * @param mimeType
   * @param stream
   * @returns
   */
  public writeFile(fileKey, mimeType, buffer) {
    fileKey = this.credentials.localStoragePath + "/" + fileKey;
    mkdirp(dirname(fileKey), function (err) {
      if (err) {
        throw "something went wrong with creating the local file";
      } else {
        fs.writeFile(fileKey, buffer, (err) => {
          if (err) {
            throw "something went wrong with creating the local file";
          }
        });
      }
    });
  }

  /**
   * Removes it from S3 deleting it forever
   * @param key
   * @returns
   */
  public deleteFile(key) {
    return fs.unlinkSync(this.credentials.localStoragePath + "/" + key);
  }

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
