import { Bundle } from "@bluelibs/core";
import { XS3BundleConfigType } from "./defs";
import { UploadService } from "./services/UploadService";
import { GraphQLBundle, Loader } from "@bluelibs/graphql-bundle";
import GraphQLAppFile from "./graphql/entities/AppFile.graphql";
import GraphQLAppFileResolvers from "./graphql/entities/AppFile.resolvers";
import GraphQLAppFileGroup from "./graphql/entities/AppFileGroup.graphql";
import { AppFileListener } from "./listeners/AppFileListener";
import {
  APP_FILES_COLLECTION_TOKEN,
  UPLOAD_CONFIG,
  APP_FILE_GROUPS_COLLECTION_TOKEN,
} from "./constants";
import { ApolloBundle } from "@bluelibs/apollo-bundle";
import { AppFilesCollection } from "./collections/appFiles/AppFiles.collection";
import { AppFileGroupsCollection } from "./collections/appFileGroups/AppFileGroups.collection";
import { prepareUploadStoresInstances } from "./services/prepareUploadStoresInstances";
import { MongoBundle } from "@bluelibs/mongo-bundle";

export class XS3Bundle extends Bundle<XS3BundleConfigType> {
  dependencies = [ApolloBundle, GraphQLBundle, MongoBundle];

  defaultConfig = {
    accessKeyId: "",
    uploadService: UploadService,
    prepareStores: prepareUploadStoresInstances,
    secretAccessKey: "",
    endpoint: "",
    region: "",
    bucket: "",
    optimizeImages: true,
    thumbs: [
      {
        id: "small",
        width: 128,
        height: 128,
      },
      {
        id: "medium",
        width: 256,
        height: 256,
      },
      {
        id: "large",
        width: 512,
        height: 512,
      },
    ],
  };

  async prepare() {
    this.container.set({
      id: APP_FILES_COLLECTION_TOKEN,
      type: this.config.appFilesCollection || AppFilesCollection,
    });
    this.container.set({
      id: APP_FILE_GROUPS_COLLECTION_TOKEN,
      type: this.config.appFileGroupsCollection || AppFileGroupsCollection,
    });
    this.config = this.config.prepareStores(this.config, this.container);
    if (this.config.uploadService) {
      this.container.set({
        id: UploadService,
        type: this.config.uploadService,
      });
    }
    this.container.set(UPLOAD_CONFIG, this.config);
    this.container.set({
      id: APP_FILES_COLLECTION_TOKEN,
      type: this.config.appFilesCollection || AppFilesCollection,
    });
    this.container.set({
      id: APP_FILE_GROUPS_COLLECTION_TOKEN,
      type: this.config.appFileGroupsCollection || AppFileGroupsCollection,
    });
  }

  async init() {
    const loader = this.container.get(Loader);
    loader.load({
      typeDefs: [GraphQLAppFile, GraphQLAppFileGroup],
      resolvers: [GraphQLAppFileResolvers],
    });
    this.container.get(UploadService);
    this.warmup([AppFileListener]);
  }
}
