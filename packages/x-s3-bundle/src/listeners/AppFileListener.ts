import { Inject, Listener, On } from "@bluelibs/core";
import { LoggerService } from "@bluelibs/logger-bundle";
import { BeforeDeleteEvent } from "@bluelibs/mongo-bundle";
import { AppFileGroupsCollection } from "../collections/appFileGroups/AppFileGroups.collection";
import { AppFilesCollection } from "../collections/appFiles/AppFiles.collection";
import {
  APP_FILES_COLLECTION_TOKEN,
  APP_FILE_GROUPS_COLLECTION_TOKEN,
} from "../constants";
import { S3UploadService } from "../services/S3UploadService";
import { FileManagementService } from "../services/FileManagementService";

export class AppFileListener extends Listener {
  @Inject(APP_FILES_COLLECTION_TOKEN)
  protected appFiles: AppFilesCollection;

  @Inject(APP_FILE_GROUPS_COLLECTION_TOKEN)
  protected appFileGroups: AppFileGroupsCollection;

  @Inject(() => FileManagementService)
  protected fileManagementService: FileManagementService;

  @Inject(() => LoggerService)
  protected logger: LoggerService;

  @On(BeforeDeleteEvent, {
    filter: (e: BeforeDeleteEvent) =>
      e.collection instanceof AppFilesCollection,
  })
  async onAppFileDelete(e: BeforeDeleteEvent) {
    const filters = e.data.filter;
    // This means that this deletion comes from `removeFile` from FileManagementService
    // So we don't need to do anything
    const alreadyHandling = e.data.context["fileDeletionProcessed"];

    if (alreadyHandling) {
      return;
    }

    const _id = filters._id;
    if (!_id) {
      this.logger.info(
        "Could not reliably delete app file from S3. Please use a deletion by id for this to work."
      );
      return;
    }

    // We say false because we don't perform actual appFile deletion
    // Because this is going to be handled either way
    await this.fileManagementService.removeFile(_id, false);
  }
}
