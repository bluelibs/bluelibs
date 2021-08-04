import { IBundleLinkCollectionOption } from "@bluelibs/mongo-bundle";
import { AppFileGroupsCollection } from "../appFileGroups/AppFileGroups.collection";

export const group: IBundleLinkCollectionOption = {
  collection: () => AppFileGroupsCollection,
  inversedBy: "files",
};
