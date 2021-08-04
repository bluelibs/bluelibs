import * as X from "@bluelibs/x-bundle";
import { IResolverMap } from "@bluelibs/graphql-bundle";
import {
  AppFilesCollection,
  AppFileGroupsCollection,
  S3UploadService,
  FileManagementService,
} from "@bluelibs/x-s3-bundle";

export default {
  Query: [
    [X.CheckLoggedIn()],
    {
      AppFilesFindOne: [X.ToNovaOne(AppFilesCollection)],
      AppFilesFind: [X.ToNova(AppFilesCollection)],
      AppFileGroupsFindOne: [X.ToNovaOne(AppFileGroupsCollection)],
      AppFileGroupsFind: [X.ToNova(AppFileGroupsCollection)],
    },
  ],
  Mutation: [
    [X.CheckLoggedIn()],
    {
      AppFileGroupsInsertOne: [
        X.ToDocumentInsert(AppFileGroupsCollection),
        X.ToNovaByResultID(AppFileGroupsCollection),
      ],
      AppFileUploadToGroup: [
        async (_, args, ctx) => {
          const { groupId, upload, context } = args;

          const uploadService = ctx.container.get(S3UploadService);
          const fileManagementService = ctx.container.get(
            FileManagementService
          );

          const appFile = await uploadService.upload(upload, {
            uploadedById: ctx.userId,
            context,
          });

          fileManagementService.addFileToFileGroup(groupId, appFile._id);

          return appFile._id;
        },
        X.ToNovaByResultID(AppFilesCollection),
      ],
      AppFileUpload: [
        async (_, args, ctx) => {
          const { upload, context } = args;

          const uploadService = ctx.container.get(S3UploadService);
          const appFile = await uploadService.upload(upload, {
            uploadedById: ctx.userId,
            context,
          });

          return appFile._id;
        },
        X.ToNovaByResultID(AppFilesCollection),
      ],
      AppFilesDeleteOne: [
        X.CheckDocumentExists(AppFilesCollection),
        X.ToDocumentDeleteByID(AppFilesCollection),
      ],
      AppFileGroupsDeleteOne: [
        X.CheckDocumentExists(AppFilesCollection),
        X.ToDocumentDeleteByID(AppFilesCollection),
      ],
    },
  ],
} as IResolverMap;
