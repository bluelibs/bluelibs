import { Collection } from "../../..";
import { ObjectId } from "mongodb";
import { Comment, Comments } from "./comments";
import { User, Users } from "./users";
import { Post, Posts } from "./posts";

export class Tag {
  _id?: ObjectId;
  title: string;
  posts: Post[] = [];

  constructor(data: Partial<Tag> = {}) {
    Object.assign(this, data);
  }
}

export class Tags extends Collection<Tag> {
  static model = Tag;
  static collectionName = "tags";

  static links = {
    posts: {
      collection: () => Posts,
      inversedBy: "tags",
    },
  };
}
