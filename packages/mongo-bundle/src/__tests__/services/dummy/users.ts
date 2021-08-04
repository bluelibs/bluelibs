import { Collection, Type } from "../../..";
import { ObjectID } from "mongodb";
import { Comment, Comments } from "./comments";
import { Posts, Post } from "./posts";

export class User {
  _id: ObjectID;
  name: string;
  title?: string;

  @Type(() => Comment)
  comments: Comment[];

  @Type(() => Post)
  posts: Post[];
}

export class Users extends Collection<User> {
  static model = User;
  static collectionName = "users";

  static links = {
    comments: {
      collection: () => Comments,
      inversedBy: "user",
    },
    posts: {
      collection: () => Posts,
      inversedBy: "author",
    },
  };
}
