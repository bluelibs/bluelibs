import { ApolloBundle } from "@bluelibs/apollo-bundle";
import {
  LocalStorageConfig,
  Store,
  StoreTypes,
  XS3BundleConfigType,
} from "../defs";
import { LocalService } from "./StoreServices/LocalService";
import { S3Service } from "./StoreServices/S3Service";

export const prepareUploadStoresInstances = (
  config: XS3BundleConfigType,
  container: any
) => {
  config.stores = config.stores.map((store: Store, index: number) => {
    if (!store.id) store.id = "store_no_" + (index + 1);
    if (!store.service) {
      switch (store.type) {
        case StoreTypes.S3: {
          store.service = new S3Service(store.id, store.credentials);
          break;
        }
        case StoreTypes.LOCAL: {
          store.service = new LocalService(store.id, store.credentials);
          const credentials = store.credentials as LocalStorageConfig;
          container.get(ApolloBundle).addRoute({
            type: "get",
            path: credentials.downloadUrl + "/*",
            handler: async (container, req, res) => {
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
        case StoreTypes.CUSTOM: {
          if (!store.service)
            throw "the service is necessary if you want your own custom upload strategy";
          break;
        }
      }
    }
    return store;
  });
  config.defaultStore =
    config.stores.find((store) => store.default) || config.stores[0];
  return config;
};
