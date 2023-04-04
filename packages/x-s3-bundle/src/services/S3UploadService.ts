import * as shortid from "shortid";
import { FileUpload } from "graphql-upload/processRequest.mjs";
import { PutObjectOutput, PutObjectRequest, S3 } from "@aws-sdk/client-s3";
import * as moment from "moment";
import { XS3BundleConfigType } from "../defs";
import { AppFile, AppFileThumb } from "../collections/appFiles/AppFile.model";
import { Inject, EventManager } from "@bluelibs/core";
import { AppFilesCollection } from "../collections/appFiles/AppFiles.collection";
import { X_S3_CONFIG_TOKEN, APP_FILES_COLLECTION_TOKEN } from "../constants";
import { ObjectID } from "@bluelibs/mongo-bundle";
import { ImageService } from "./ImageService";
import { BeforeFileUploadEvent, AfterFileUploadEvent } from "../events";

export class S3UploadService {
  protected s3: S3;

  constructor(
    @Inject(X_S3_CONFIG_TOKEN)
    protected readonly config: XS3BundleConfigType,

    @Inject(APP_FILES_COLLECTION_TOKEN)
    protected readonly appFiles: AppFilesCollection,

    protected readonly eventManager: EventManager,
    protected readonly imageService: ImageService
  ) {
    const { s3 } = config;
    this.s3 = new S3(s3);
  }

  /**
   * This gets a file from GraphQL upload and returns the AppFile object.
   * @param upload
   * @returns
   */
  async upload(
    upload: Promise<FileUpload>,
    extension?: Partial<AppFile>
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
        mimetype
      );
    }

    const appFile = await this.doUpload(filename, mimetype, buffer, extension);

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
    mimetype: string
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
        response[id]
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
    extension?: Partial<AppFile>
  ): Promise<AppFile> {
    const fileKey = await this.uploadBuffer(filename, mimetype, buffer);

    const appFile = new AppFile();
    if (extension) {
      Object.assign(appFile, extension);
    }

    appFile.path = fileKey;
    appFile.name = filename;
    appFile.mimeType = mimetype;
    appFile.size = Buffer.byteLength(buffer);

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
    buffer: Buffer
  ) {
    const id = shortid.generate();
    const fileName = `${id}-${filename}`;
    const fileKey = this.generateKey(fileName);

    await this.putObject(fileKey, mimetype, buffer);

    return fileKey;
  }

  /**
   * Uploads your buffer/stream to the desired path in S3
   * @param fileKey
   * @param mimeType
   * @param stream
   * @returns
   */
  async putObject(fileKey, mimeType, stream): Promise<PutObjectOutput> {
    const params: PutObjectRequest = {
      Bucket: this.config.bucket,
      Key: fileKey,
      Body: stream,
      ContentType: mimeType,
      ACL: "public-read",
    };

    return this.s3.putObject(params);
  }

  /**
   * Removes it from S3 deleting it forever
   * @param key
   * @returns
   */
  async remove(key) {
    return this.s3.deleteObject({
      Bucket: this.config.bucket,
      Key: key,
    });
  }

  /**
   * Use this method when you easily want to get the downloadable URL of the file.
   * @param fileId
   * @returns
   */
  async getFileURL(fileId: ObjectID) {
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

    return this.getUrl(file.path);
  }

  /**
   * Returns the downloadable URL for the specified key
   *
   * @param key
   * @returns
   */
  getUrl(key: string): string {
    let urlPath = this.config.endpoint;
    if (urlPath[urlPath.length - 1] !== "/") {
      urlPath = urlPath + "/";
    }
    if (key[0] === "/") {
      key = key.slice(1);
    }
    // urlPath ends with '/', key surely doesn't
    return urlPath + key;
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
}
