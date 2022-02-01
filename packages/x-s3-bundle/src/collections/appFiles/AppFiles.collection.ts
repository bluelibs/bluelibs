import { Collection, Behaviors } from "@bluelibs/mongo-bundle";
import * as reducers from "./AppFiles.reducers";
import * as links from "./AppFiles.links";
import { AppFile } from "./AppFile.model";
import { IExpanderOptions } from "@bluelibs/nova";

export class AppFilesCollection extends Collection<AppFile> {
  static collectionName = "appFiles";
  static model = AppFile;

  static reducers = reducers;
  static links = links;

  static behaviors = [Behaviors.Timestampable()];

  // Ensuring thumbs are always requested fully
  static expanders = {
    path: {
      thumbs: 1,
    },
    downloadUrl: {
      thumbs: 1,
      path: 1,
    },
    _id: {
      thumbs: 1,
    },
  };
}
