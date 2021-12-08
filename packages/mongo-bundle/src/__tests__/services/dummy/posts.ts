import { Collection } from "../../..";
import { ObjectId } from "mongodb";
import { Comment, Comments } from "./comments";
import { User, Users } from "./users";
import { Tag, Tags } from "./tags";

export class Post {
  constructor(data: Partial<Post> = {}) {
    Object.assign(this, data);
  }

  _id?: ObjectId;
  title: string;

  comments: Comment[] = [];

  authorId: ObjectId | any;
  author: User;

  number?: string | number;
  tags: Tag[] = [];
  tagsIds: ObjectId[] = [];
}

export class Posts extends Collection<Post> {
  static model = Post;
  static collectionName = "posts";

  static indexes = [
    {
      key: { authorId: 1 },
    },
  ];

  static links = {
    comments: {
      collection: () => Comments,
      inversedBy: "post",
    },
    tags: {
      collection: () => Tags,
      field: "tagsIds",
      many: true,
    },
    author: {
      collection: () => Users,
      field: "authorId",
    },
  };
}
