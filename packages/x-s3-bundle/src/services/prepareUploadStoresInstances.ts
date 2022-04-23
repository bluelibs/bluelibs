import { ApolloBundle } from "@bluelibs/apollo-bundle";
import { AppFile } from "../collections/appFiles/AppFile.model";
import { AppFilesCollection } from "../collections/appFiles/AppFiles.collection";
import {
  DBStorageConfig,
  LocalStorageConfig,
  UploadCredentials,
  XS3BundleConfigType,
} from "../defs";
import { DbService } from "./StoreServices/DbService";
import { LocalService } from "./StoreServices/LocalService";
import { S3Service } from "./StoreServices/S3Service";
import { dirname } from "path";
import * as mkdirp from "mkdirp";
import * as fs from "fs";
import { APP_FILES_COLLECTION_TOKEN } from "../constants";
import { IStoreUploadService } from "./IStoreUploadService";

export const prepareUploadStoresInstances = (
  config: XS3BundleConfigType,
  container: any
) => {
  config.stores = config.stores.map(
    (store: IStoreUploadService, index: number) => {
      switch (true) {
        case store instanceof S3Service: {
          break;
        }
        case store instanceof LocalService: {
          const credentials = store.credentials as LocalStorageConfig;
          container.get(ApolloBundle).addRoute({
            type: "get",
            path: credentials.downloadUrl + "/*",
            handler: credentials.downloadHandler
              ? credentials.downloadHandler
              : async (container, req, res) => {
                  const file = `./${credentials.localStoragePath}/${req.params[0]}`;
                  res.download(file);
                },
          });

          credentials.downloadUrl =
            container.get(ApolloBundle).getConfig().url +
            credentials.downloadUrl;
          (store.credentials as LocalStorageConfig) = credentials;
          break;
        }
        case store instanceof DbService: {
          container.get(ApolloBundle).addRoute({
            type: "get",
            path: (store.credentials as DBStorageConfig).downloadUrl + "/*",
            handler: store.credentials.downloadHandler
              ? store.credentials.downloadHandler
              : async (container, req, res) => {
                  let key = req.params[0];
                  const appFile = await container
                    .get(APP_FILES_COLLECTION_TOKEN)
                    .findOne(
                      {
                        store: store.id,
                        $or: [{ path: key }, { "thumbs.path": key }],
                      },
                      {
                        projection: {
                          thumbs: 1,
                          path: 1,
                          buffer: 1,
                        },
                      }
                    );
                  if (!appFile) throw "no file found with such key";
                  const buffer: string =
                    appFile.path === key
                      ? appFile.buffer
                      : appFile.thumbs.find((t) => t.path === key)?.buffer;
                  const parentFolder = "./temp/" + Date.now();

                  key = parentFolder + key;
                  await mkdirp(dirname(key), async function (err) {
                    if (err) {
                      throw "something went wrong with creating the local file";
                    } else {
                      fs.writeFile(
                        key,
                        Buffer.from(buffer, "base64"),
                        (err) => {
                          if (err) {
                            throw "something went wrong with creating the local file";
                          }
                          const file = key;
                          res.download(file, () => {
                            fs.rmSync(parentFolder, {
                              recursive: true,
                              force: true,
                            });
                          });
                        }
                      );
                    }
                  });
                },
          });
          (store.credentials as DBStorageConfig).downloadUrl =
            container.get(ApolloBundle).getConfig().url +
            (store.credentials as DBStorageConfig).downloadUrl;
          break;
        }
      }

      return store;
    }
  );
  config.defaultStore =
    config.stores.find((store) => store.default) || config.stores[0];
  return config;
};
