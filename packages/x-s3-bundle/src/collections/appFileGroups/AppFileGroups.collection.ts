import { Collection, Behaviors } from "@bluelibs/mongo-bundle";
import * as reducers from "./AppFileGroups.reducers";
import * as links from "./AppFileGroups.links";
import { AppFileGroup } from "./AppFileGroup.model";

export class AppFileGroupsCollection extends Collection<AppFileGroup> {
  static collectionName = "appFileGroups";
  static model = AppFileGroup;

  static reducers = reducers;
  static links = links;

  static behaviors = [Behaviors.Timestampable(), Behaviors.Blameable()];
}
