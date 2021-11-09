import { IBundleLinkCollectionOption } from "@bluelibs/mongo-bundle";
import { UsersCollection } from "../collections/Users.collection";

export const user: IBundleLinkCollectionOption = {
  collection: () => UsersCollection,
  field: "userId",
};

export const createdBy: IBundleLinkCollectionOption = {
  collection: () => UsersCollection,
  field: "createdById",
};
