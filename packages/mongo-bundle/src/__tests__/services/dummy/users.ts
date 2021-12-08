import { Collection } from "../../..";
import { Type } from "class-transformer";
import { ObjectId } from "mongodb";
import { Comment, Comments } from "./comments";
import { Posts, Post } from "./posts";

export class User {
  constructor(data: Partial<User> = {}) {
    Object.assign(this, data);
  }

  _id?: ObjectId;
  name: string;
  title?: string;

  @Type(() => Comment)
  comments: Comment[] = [];

  @Type(() => Post)
  posts: Post[] = [];
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
