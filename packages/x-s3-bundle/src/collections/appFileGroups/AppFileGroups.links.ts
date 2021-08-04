import { IBundleLinkCollectionOption } from "@bluelibs/mongo-bundle";
import { AppFilesCollection } from "../appFiles/AppFiles.collection";

export const files: IBundleLinkCollectionOption = {
  collection: () => AppFilesCollection,
  field: "filesIds",
  many: true,
};
