import { ContainerInstance } from "@bluelibs/core";
import { IResolverMap } from "@bluelibs/graphql-bundle";
import {
  AppFile,
  AppFileThumb,
} from "../../collections/appFiles/AppFile.model";
import { UploadService } from "../../services/UploadService";

export default {
  AppFile: {
    downloadUrl(appFile: Partial<AppFile>, args, ctx) {
      // if it was fetched through nova and injected as a reducer
      if (!appFile.downloadUrl) {
        const service = ctx.container.get(UploadService);

        return service.getUrl(appFile.path);
      }

      return appFile.downloadUrl;
    },
    thumbs(appFile: Partial<AppFile>, args) {
      if (args.ids && appFile.thumbs) {
        return appFile.thumbs.map((t) => args.ids.includes(t.id));
      }

      return appFile.thumbs;
    },
  },
  AppFileThumb: {
    downloadUrl(appFileThumb: Partial<AppFileThumb>, args, ctx) {
      const service = ctx.container.get(UploadService);

      return service.getUrl(appFileThumb.path);
    },
    type(appFileThumb: Partial<AppFileThumb>) {
      return appFileThumb.id;
    },
  },
} as IResolverMap;
