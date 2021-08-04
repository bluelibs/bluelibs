import * as shortid from "shortid";
import { URL } from "url";
import { Upload } from "graphql-upload";
import { S3 } from "aws-sdk";
import * as moment from "moment";
import { AWSS3Config } from "../defs";
import { AppFile } from "../collections/appFiles/AppFile.model";
import { Inject } from "@bluelibs/core";
import { AppFileGroupsCollection } from "../collections/appFileGroups/AppFileGroups.collection";
import { AppFilesCollection } from "../collections/appFiles/AppFiles.collection";
import { ObjectID } from "@bluelibs/mongo-bundle";
import { S3UploadService } from "./S3UploadService";
import { LoggerService } from "@bluelibs/logger-bundle";
import {
  APP_FILES_COLLECTION_TOKEN,
  APP_FILE_GROUPS_COLLECTION_TOKEN,
} from "../constants";

export class FileManagementService {
  protected config: AWSS3Config;
  protected s3: S3;

  @Inject(APP_FILES_COLLECTION_TOKEN)
  protected appFiles: AppFilesCollection;

  @Inject(APP_FILE_GROUPS_COLLECTION_TOKEN)
  protected appFileGroups: AppFileGroupsCollection;

  @Inject(() => S3UploadService)
  protected uploadService: S3UploadService;

  @Inject(() => LoggerService)
  protected logger: LoggerService;

  /**
   * Creates a new file group
   * @param name This field is optional it's helpful if you want to easily identify the filegroup by name
   * @returns The _id of the file group
   */
  async newFileGroup(name?: string): Promise<ObjectID> {
    const result = await this.appFileGroups.insertOne({ name, filesIds: [] });

    return result.insertedId;
  }

  /**
   * Adds a file to the group
   * @param fileGroupId
   * @param fileId
   */
  async addFileToFileGroup(fileGroupId: ObjectID, fileId: ObjectID) {
    await this.appFileGroups.updateOne(
      { _id: fileGroupId },
      {
        $addToSet: {
          filesIds: fileId,
        },
      }
    );
  }

  /**
   * Retrieve a file by id
   * @param fileId
   * @returns
   */
  async getFile(fileId: ObjectID): Promise<AppFile> {
    return this.appFiles.findOne({ _id: fileId });
  }

  /**
   * This is the typical way and recommended way to remove a file, it will ensure the groups are clean and delete it from the upload service
   * @param fileId
   */
  async removeFile(fileId: ObjectID, performActualDelete = true) {
    const appFile = await this.appFiles.findOne(
      { _id: fileId },
      {
        projection: {
          _id: 1,
          path: 1,
          thumbs: 1,
        },
      }
    );

    try {
      await this.uploadService.remove(appFile.path);
      if (appFile.thumbs) {
        for (const thumb of appFile.thumbs) {
          await this.uploadService.remove(thumb.path);
        }
      }
    } catch (e) {
      this.logger.error(
        `Failed to remove media file: ${JSON.stringify(appFile, null, 4)}`
      );
    }

    await this.removeFileFromAllGroups(appFile);

    if (performActualDelete) {
      await this.appFiles.deleteOne(
        {
          _id: fileId,
        },
        {
          context: {
            fileDeletionProcessed: true,
          },
        }
      );
    }
  }

  /**
   * Conceptually a file can belong in many file groups.
   * @param appFile
   */
  protected async removeFileFromAllGroups(appFile: AppFile) {
    await this.appFileGroups.updateMany(
      {
        filesIds: {
          $in: [appFile._id],
        },
      },
      {
        $pull: {
          filesIds: appFile._id,
        },
      }
    );
  }
}
