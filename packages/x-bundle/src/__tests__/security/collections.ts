import { Collection } from "@bluelibs/mongo-bundle";
import { Live } from "../../behaviors/live.behavior";

export class PostsCollection extends Collection {
  static collectionName = "posts_security";
}
