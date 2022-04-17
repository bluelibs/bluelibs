import * as fs from "fs";
import { LocalStorageConfig, UploadCredentials } from "../../defs";
import { IStoreUploadService } from "../IStoreUploadService";
import { dirname } from "path";
import * as mkdirp from "mkdirp";

export class LocalService {
  protected id: string;
  protected credentials: LocalStorageConfig;

  constructor(id: string, credentials: UploadCredentials) {
    //super(id, credentials);
    this.credentials = credentials as LocalStorageConfig;
    this.id = id;
  }

  public getInstance() {
    return { localStoragePath: this.credentials.localStoragePath };
  }

  /**
   * Uploads your buffer/stream to the desired path in S3
   * @param fileKey
   * @param mimeType
   * @param stream
   * @returns
   */
  public writeFile(fileKey, mimeType, buffer) {
    console.log(fileKey, fileKey);
    console.log(buffer, buffer);
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
    return fs.unlinkSync(key);
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
