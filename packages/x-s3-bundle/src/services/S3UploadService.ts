import * as shortid from "shortid";
import { FileUpload } from "graphql-upload";
import { S3 } from "aws-sdk";
import * as moment from "moment";
import { Store, XS3BundleConfigType } from "../defs";
import { AppFile, AppFileThumb } from "../collections/appFiles/AppFile.model";
import { Inject, EventManager } from "@bluelibs/core";
import { AppFilesCollection } from "../collections/appFiles/AppFiles.collection";
import { UPLOAD_CONFIG, APP_FILES_COLLECTION_TOKEN } from "../constants";
import { ObjectID } from "@bluelibs/mongo-bundle";
import { ImageService } from "./ImageService";
import { BeforeFileUploadEvent, AfterFileUploadEvent } from "../events";

export class S3UploadService {
  //protected s3: S3;
  protected stores: Store[];
  protected defaultStore: Store;

  constructor(
    @Inject(UPLOAD_CONFIG)
    protected readonly config: XS3BundleConfigType,

    @Inject(APP_FILES_COLLECTION_TOKEN)
    protected readonly appFiles: AppFilesCollection,

    protected readonly eventManager: EventManager,
    protected readonly imageService: ImageService
  ) {
    (this.stores = config.stores), (this.defaultStore = config.defaultStore);
    //const { s3 } = config;
    //this.s3 = new S3(s3);
  }

  /**
   * This gets a file from GraphQL upload and returns the AppFile object.
   * @param upload
   * @returns
   */
  async upload(
    upload: Promise<FileUpload>,
    extension?: Partial<AppFile>,
    storeId?: string
  ): Promise<AppFile> {
    extension = extension || {};
    const { createReadStream, filename, mimetype } = await upload;
    const stream = createReadStream();

    let buffer = await this.streamToBuffer(stream);

    await this.eventManager.emit(
      new BeforeFileUploadEvent({
        filename,
        mimetype,
        buffer,
        extension,
      })
    );

    if (this.imageService.isMimeTypeImage(mimetype)) {
      buffer = await this.handleImageUploading(
        buffer,
        extension,
        filename,
        mimetype,
        storeId
      );
    }

    const appFile = await this.doUpload(
      filename,
      mimetype,
      buffer,
      extension,
      storeId
    );

    await this.eventManager.emit(
      new AfterFileUploadEvent({
        appFile,
      })
    );

    return appFile;
  }

  protected async handleImageUploading(
    buffer: Buffer,
    extension: Partial<AppFile>,
    filename: string,
    mimetype: string,
    storeId?: string
  ) {
    const response = await this.imageService.getImageThumbs(
      buffer,
      extension?.context
    );
    const thumbs: AppFileThumb[] = [];
    for (const id in response) {
      const newFileName = this.injectFileSuffix(filename, id);
      const newFileKey = await this.uploadBuffer(
        newFileName,
        mimetype,
        response[id],
        storeId
      );
      thumbs.push({
        id,
        path: newFileKey,
      });
    }
    Object.assign(extension, { thumbs });
    return buffer;
  }

  /**
   * Easy to use method for uploading from a buffer directly and returns
   *
   * @param filename
   * @param mimetype
   * @param buffer
   * @param extension
   * @returns
   */
  public async doUpload(
    filename: string,
    mimetype: string,
    buffer: Buffer,
    extension?: Partial<AppFile>,
    storeId?: string
  ): Promise<AppFile> {
    const fileKey = await this.uploadBuffer(
      filename,
      mimetype,
      buffer,
      storeId
    );

    const appFile = new AppFile();
    if (extension) {
      Object.assign(appFile, extension);
    }

    appFile.path = fileKey;
    appFile.name = filename;
    appFile.mimeType = mimetype;
    appFile.size = Buffer.byteLength(buffer);
    appFile.store = storeId;

    const result = await this.appFiles.insertOne(appFile);
    appFile._id = result.insertedId;

    return appFile;
  }

  /**
   * Uploads the buffer to s3 and gives you the fileKey
   * @param filename
   * @param mimetype
   * @param buffer
   * @returns
   */
  protected async uploadBuffer(
    filename: string,
    mimetype: string,
    buffer: Buffer,
    storeId?: string
  ) {
    const id = shortid.generate();
    const fileName = `${id}-${filename}`;
    const fileKey = this.generateKey(fileName);

    await this.getTargetStore(storeId).service.writeFile(
      fileKey,
      mimetype,
      buffer
    );

    return fileKey;
  }

  /**
   * Use this method when you easily want to get the downloadable URL of the file.
   * @param fileId
   * @returns
   */
  async getFileURL(fileId: ObjectID, storeId?: string) {
    const query: any = { _id: fileId };
    if (storeId) query.store = storeId;

    const file = await this.appFiles.findOne(
      { _id: fileId },
      {
        projection: {
          path: 1,
        },
      }
    );

    if (!file) {
      throw new Error(`File with id: ${fileId} was not found`);
    }

    return this.getTargetStore(storeId).service.getDownloadUrl(file.path);
  }

  /**
   * Based on file name it can generate a secure upload key
   * @param filename
   * @param context
   * @returns
   */
  generateKey(filename: string, context = ""): string {
    const dateFolder = `${moment().locale("en").format("YYYY")}/${moment()
      .locale("en")
      .format("MM")}/${moment().locale("en").format("DD")}`;

    let key = `${dateFolder}/${shortid.generate()}`;

    if (context !== "") {
      key += `-${context}`;
    }

    return `${key}-${filename}`;
  }
  /**
   * Uploads your buffer/stream to the desired path in S3
   * @param fileKey
   * @param mimeType
   * @param stream
   * @returns
   */
  async putObject(fileKey, mimeType, stream, storeId?: string): Promise<any> {
    return this.getTargetStore(storeId).service.writeFile(
      fileKey,
      mimeType,
      stream
    );
  }

  /**
   * Removes it from S3 deleting it forever
   * @param key
   * @returns
   */
  async remove(key, storeId?: string) {
    return this.getTargetStore(storeId).service.deleteFile(key);
  }

  /**
   * Returns the downloadable URL for the specified key
   *
   * @param key
   * @returns
   */
  getUrl(key: string, storeId?: string): string {
    return this.getTargetStore(storeId).service.getDownloadUrl(key);
  }

  /**
   * Gets a stream and puts it in the Buffer
   * @param stream
   * @returns
   */
  async streamToBuffer(stream): Promise<Buffer> {
    const buffs = [];
    return new Promise((resolve, reject) =>
      stream
        .on("data", (chunk) => buffs.push(chunk))
        .on("error", (error) => reject(error))
        .on("end", () => resolve(Buffer.concat(buffs)))
        .on("finish", () => resolve(Buffer.concat(buffs)))
    );
  }

  /**
   * Transforms /whatever/path/file.png, small -> /whatever/path/file-small.png
   */
  protected injectFileSuffix(path: string, suffix: string): string {
    const parts = path.split(".");

    return [...parts.slice(0, -1), suffix, parts[parts.length - 1]].join(".");
  }

  getTargetStore(storeId?: string): Store {
    if (!storeId) return this.defaultStore;
    const store = this.stores.find((st) => st.id === storeId);
    if (!store) throw "Couldn't find the store with id" + storeId;
    return store;
  }
}
