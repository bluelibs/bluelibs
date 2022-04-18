import { UploadCredentials } from "../defs";

export abstract class IStoreUploadService {
  constructor(id: string, credentials: UploadCredentials) {}
  abstract writeFile(
    fileKey: string,
    mimeType: string,
    stream: any
  ): Promise<any> | void;
  abstract deleteFile(key: string): Promise<any> | void;
  abstract getDownloadUrl(key: string): string;
}
