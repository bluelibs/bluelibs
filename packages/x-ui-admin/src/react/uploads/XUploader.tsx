import { Service } from "@bluelibs/core";
import { ApolloClient, Collection } from "@bluelibs/x-ui";
import { ObjectId } from "@bluelibs/ejson";
import { UPLOAD_FILE, UPLOAD_FILE_TO_GROUP } from "./graphql";
import { UploadFile } from "antd/lib/upload/interface";

export type AppFile = {
  _id: ObjectId;
  name: string;
  mimeType: string;
  size: number;
  downloadUrl: string;
};

export type AppFileGroup = {
  _id: ObjectId;
  name?: string;
  files: AppFile[];
};

@Service()
export class AppFilesCollection extends Collection<AppFile> {
  getName() {
    return "AppFiles";
  }
}

@Service()
export class AppFileGroupsCollection extends Collection<AppFileGroup> {
  getName() {
    return "AppFileGroups";
  }
}

@Service()
export class XUploader {
  constructor(
    protected readonly apolloClient: ApolloClient,
    public readonly appFilesCollection: AppFilesCollection,
    public readonly appFileGroupsCollection: AppFileGroupsCollection
  ) {}

  uploadFile(file: File, context?: string): Promise<AppFile> {
    return this.apolloClient
      .mutate({
        mutation: UPLOAD_FILE,
        variables: {
          upload: file,
          context,
        },
      })
      .then((result) => {
        if (result.errors?.length) {
          return null;
        } else {
          return result.data["AppFileUpload"] as AppFile;
        }
      });
  }

  async createNewFileGroup(): Promise<ObjectId> {
    const appFileGroup = await this.appFileGroupsCollection.insertOne({});

    return appFileGroup._id;
  }

  transformToUploadFile(appFile: Partial<AppFile>): UploadFile {
    return {
      uid: appFile._id.toString(),
      name: appFile.name,
      url: appFile.downloadUrl,
      type: appFile.mimeType,
      size: appFile.size,
    };
  }

  async getUploadFile(_id: string | ObjectId): Promise<UploadFile> {
    return this.appFilesCollection
      .findOneById(_id, {
        _id: 1,
        name: 1,
        downloadUrl: 1,
        mimeType: 1,
        size: 1,
      })
      .then((appFile) => this.transformToUploadFile(appFile));
  }

  async getUploadFiles(ids: string[] | ObjectId[]): Promise<UploadFile[]> {
    if (ids.length === 0) {
      return [];
    }

    return this.appFilesCollection
      .find(
        { filters: { _id: { $in: ids } } },
        {
          _id: 1,
          name: 1,
          downloadUrl: 1,
          mimeType: 1,
          size: 1,
        }
      )
      .then((appFiles) =>
        appFiles.map((appFile) => this.transformToUploadFile(appFile))
      );
  }

  async getFileGroup(
    groupId: string | ObjectId
  ): Promise<Partial<AppFileGroup>> {
    return this.appFileGroupsCollection.findOneById(groupId, {
      _id: 1,
      files: {
        _id: 1,
        name: 1,
        downloadUrl: 1,
        mimeType: 1,
        size: 1,
      },
    });
  }

  uploadFileToGroup(
    groupId: string | ObjectId,
    file: File,
    context?: string
  ): Promise<AppFile> {
    return this.apolloClient
      .mutate({
        mutation: UPLOAD_FILE_TO_GROUP,
        variables: {
          groupId,
          upload: file,
          context,
        },
      })
      .then((result) => {
        if (result.errors?.length) {
          return null;
        } else {
          return result.data["AppFileUploadToGroup"] as AppFile;
        }
      });
  }
}
