import { Collection, Behaviors } from "@bluelibs/mongo-bundle";
import * as reducers from "./AppFiles.reducers";
import * as links from "./AppFiles.links";
import { AppFile } from "./AppFile.model";

export class AppFilesCollection extends Collection<AppFile> {
  static collectionName = "appFiles";
  static model = AppFile;

  static reducers = reducers;
  static links = links;

  static behaviors = [Behaviors.Timestampable()];
}
