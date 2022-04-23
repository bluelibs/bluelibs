import { StoreConfig, ThumbConfigType, UploadCredentials } from "../defs";

export abstract class IStoreUploadService {
  public id: string;
  public thumbs: ThumbConfigType[];
  public credentials: UploadCredentials;
  public default: boolean;
  constructor(storeConfig: StoreConfig) {
    this.id = storeConfig.id;
    this.credentials = storeConfig.credentials;
    this.thumbs = storeConfig.thumbs;
    this.default = storeConfig.default;
  }

  abstract writeFile(
    fileKey: string,
    mimeType: string,
    stream: any
  ): Promise<any> | void;
  abstract deleteFile(key: string): Promise<any> | void;
  abstract getDownloadUrl(key: string): string;
}
