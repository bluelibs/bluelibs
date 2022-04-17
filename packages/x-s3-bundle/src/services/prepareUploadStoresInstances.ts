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
  config.stores = config.stores.map((store: Store) => {
    if (!store.service) {
      switch (store.type) {
        case StoreTypes.S3: {
          store.service = S3Service;
          break;
        }
        case StoreTypes.LOCAL: {
          store.service = LocalService;
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
      }
    }
    return {
      ...store,
      serviceInstance: new store.service(store.id, store.credentials),
    };
  });
  config.defaultStore =
    config.stores.find((store) => store.default) || config.stores[0];
  return config;
};
