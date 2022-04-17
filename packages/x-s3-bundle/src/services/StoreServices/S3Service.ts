import { S3 } from "aws-sdk";
import { AWSS3Config, UploadCredentials } from "../../defs";
import { IStoreUploadService } from "../IStoreUploadService";

export class S3Service implements IStoreUploadService {
  protected id: string;
  protected s3: S3;
  protected credentials: AWSS3Config;

  constructor(id: string, credentials: UploadCredentials) {
    //super(id, credentials);
    this.credentials = credentials as AWSS3Config;
    this.s3 = new S3(this.credentials);

    this.id = id;
  }

  public getInstance() {
    return this.s3;
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
