import { S3 } from "aws-sdk";
import { AWSS3Config, StoreConfig, UploadCredentials } from "../../defs";
import { IStoreUploadService } from "../IStoreUploadService";

export class S3Service extends IStoreUploadService {
  protected s3: S3;

  constructor(storeConfig: StoreConfig) {
    super(storeConfig);
    this.s3 = new S3(this.credentials);
  }

  /**
   * Uploads your buffer/stream to the desired path in S3
   * @param fileKey
   * @param mimeType
   * @param stream
   * @returns
   */
  public writeFile(fileKey, mimeType, stream) {
    const params: S3.PutObjectRequest = {
      Bucket: this.credentials.bucket,
      Key: fileKey,
      Body: stream,
      ContentType: mimeType,
      ACL: "public-read",
    };

    return this.s3.putObject(params).promise();
  }

  /**
   * Removes it from S3 deleting it forever
   * @param key
   * @returns
   */
  public deleteFile(key) {
    return this.s3
      .deleteObject({
        Bucket: this.credentials.bucket,
        Key: key,
      })
      .promise();
  }

  /**
   * Returns the downloadable URL for the specified key
   *
   * @param key
   * @returns
   */
  public getDownloadUrl(key: string): string {
    let urlPath = this.credentials.endpoint;
    if (urlPath[urlPath.length - 1] !== "/") {
      urlPath = urlPath + "/";
    }
    if (key[0] === "/") {
      key = key.slice(1);
    }
    // urlPath ends with '/', key surely doesn't
    return urlPath + key;
  }
}
