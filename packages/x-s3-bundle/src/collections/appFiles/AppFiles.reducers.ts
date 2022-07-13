import { ContainerInstance } from "@bluelibs/core";
import { IReducerOption } from "@bluelibs/nova";
import { UploadService } from "../../services/UploadService";

// Export link names as constants with type of: BundleLinkCollectionOption, sample:
// export const myCustomLink: IReducerOption = { ... }
export const downloadUrl: IReducerOption = {
  dependency: {
    path: 1,
    resourceType: 1,
    resourceId: 1,
  },
  reduce(upload, params) {
    // To fix TS later, interface extension from mongo-bundle to nova is not taken into account for some reason
    const container: ContainerInstance = (params.context as any).container;
    const service = container.get(UploadService);

    return service.getUrl(upload.path);
  },
};
