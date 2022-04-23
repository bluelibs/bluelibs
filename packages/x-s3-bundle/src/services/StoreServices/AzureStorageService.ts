import { StoreConfig } from "../../defs";
import { IStoreUploadService } from "../IStoreUploadService";
import { BlobServiceClient } from "@azure/storage-blob";

export class AzureStorageService extends IStoreUploadService {
  protected blobServiceClient: any;
  protected containerClient: any;

  constructor(storeConfig: StoreConfig) {
    super(storeConfig);
    this.blobServiceClient = BlobServiceClient.fromConnectionString(
      this.credentials.connectionId
    );
    this.containerClient = this.blobServiceClient.getContainerClient(
      this.credentials.containerName
    );
  }

  /**
   * Uploads your buffer/stream to the desired path in azure
   * @param fileKey
   * @param mimeType
   * @param stream
   * @returns
   */
  public writeFile(fileKey, mimeType, stream) {
    const blockBlobClient = this.containerClient.getBlockBlobClient(fileKey);
    return blockBlobClient.uploadData(stream, {
      blobHTTPHeaders: {
        blobContentType: mimeType,
      },
    });
  }

  /**
   * Removes it from azure deleting it forever
   * @param key
   * @returns
   */
  public deleteFile(key) {
    return this.containerClient.deleteBlob(key);
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
