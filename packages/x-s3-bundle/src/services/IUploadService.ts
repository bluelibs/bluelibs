import { FileUpload } from "graphql-upload";
import { AppFile } from "../collections/appFiles/AppFile.model";
import { ObjectID } from "@bluelibs/mongo-bundle";
import { Store } from "../defs";

export interface IUploadService {
  /**
   * This gets a file from GraphQL upload and returns the AppFile object.
   * @param upload
   * @returns
   */
  upload(
    upload: Promise<FileUpload>,
    extension?: Partial<AppFile>,
    storeId?: string
  ): Promise<AppFile>;

  handleImageUploading(
    buffer: Buffer,
    extension: Partial<AppFile>,
    filename: string,
    mimetype: string,
    storeId?: string
  );

  /**
   * Easy to use method for uploading from a buffer directly and returns
   *
   * @param filename
   * @param mimetype
   * @param buffer
   * @param extension
   * @returns
   */
  doUpload(
    filename: string,
    mimetype: string,
    buffer: Buffer,
    extension?: Partial<AppFile>,
    storeId?: string
  ): Promise<AppFile>;

  /**
   * Uploads the buffer to s3 and gives you the fileKey
   * @param filename
   * @param mimetype
   * @param buffer
   * @returns
   */
  uploadBuffer(
    filename: string,
    mimetype: string,
    buffer: Buffer,
    storeId?: string
  );

  /**
   * Use this method when you easily want to get the downloadable URL of the file.
   * @param fileId
   * @returns
   */
  getFileURL(fileId: ObjectID, storeId?: string);

  /**
   * Based on file name it can generate a secure upload key
   * @param filename
   * @param context
   * @returns
   */
  generateKey(filename: string, context: string): string;
  /**
   * Uploads your buffer/stream to the desired path in S3
   * @param fileKey
   * @param mimeType
   * @param stream
   * @returns
   */
  putObject(fileKey, mimeType, stream, storeId?: string): Promise<any>;

  /**
   * Removes it from S3 deleting it forever
   * @param key
   * @returns
   */
  remove(key, storeId?: string);

  /**
   * Returns the downloadable URL for the specified key
   *
   * @param key
   * @returns
   */
  getUrl(key: string, storeId?: string): string;

  /**
   * Gets a stream and puts it in the Buffer
   * @param stream
   * @returns
   */
  streamToBuffer(stream): Promise<Buffer>;

  /**
   * Transforms /whatever/path/file.png, small -> /whatever/path/file-small.png
   */
  injectFileSuffix(path: string, suffix: string): string;

  getTargetStore(storeId?: string): Store;
}
