import { addLinks } from "@bluelibs/nova";
import { Collection, MongoClient } from "mongodb";
import * as mongoose from "mongoose";

// Connection URI
const DB = "nova";
// const MONGO_URI = `mongodb://18.156.171.158:25000/${DB}`;
const MONGO_URI = `mongodb://localhost:27017/${DB}`;

// Create a new MongoClient
const client = new MongoClient(MONGO_URI);

export const mongooseModels: {
  [key: string]: mongoose.Model<any>;
} = {};

export const db: {
  [key: string]: Collection;
} = {};

export async function setup() {
  await mongoose.connect(MONGO_URI, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  });

  const UserSchema = new mongoose.Schema({
    _id: Number,
    email: String,
    name: String,
    groups: [{ type: mongoose.Schema.Types.Number, ref: "Group" }],
  });
  UserSchema.virtual("posts", {
    ref: "Post",
    localField: "_id",
    foreignField: "user",
  });
  UserSchema.virtual("comments", {
    ref: "Comment",
    localField: "_id",
    foreignField: "user",
  });

  const GroupSchema = new mongoose.Schema({
    _id: Number,
    name: String,
  });

  GroupSchema.virtual("users", {
    ref: "User",
    localField: "_id",
    foreignField: "groups",
  });

  const TagSchema = new mongoose.Schema({
    _id: Number,
    name: String,
  });
  TagSchema.virtual("posts", {
    ref: "Post",
    localField: "_id",
    foreignField: "tags",
  });

  const PostCategorySchema = new mongoose.Schema({
    _id: Number,
    name: String,
  });
  PostCategorySchema.virtual("posts", {
    ref: "Post",
    localField: "_id",
    foreignField: "category",
  });

  const CommentSchema = new mongoose.Schema({
    _id: Number,
    text: String,
    post: { type: mongoose.Schema.Types.Number, ref: "Post" },
    user: { type: mongoose.Schema.Types.Number, ref: "User" },
  });

  const PostSchema = new mongoose.Schema({
    _id: Number,
    title: String,
    description: String,
    tags: [{ type: mongoose.Schema.Types.Number, ref: "Tag" }],
    category: { type: mongoose.Schema.Types.Number, ref: "PostsCategory" },
    user: { type: mongoose.Schema.Types.Number, ref: "User" },
  });

  PostSchema.virtual("comments", {
    ref: "Comment",
    localField: "_id",
    foreignField: "post",
    justOne: false,
  });

  mongooseModels.User = mongoose.model("User", UserSchema);
  mongooseModels.Tag = mongoose.model("Tag", TagSchema);
  mongooseModels.Post = mongoose.model("Post", PostSchema);
  mongooseModels.PostsCategory = mongoose.model(
    "PostsCategory",
    PostCategorySchema
  );
  mongooseModels.Comment = mongoose.model("Comment", CommentSchema);
  mongooseModels.Group = mongoose.model("Group", GroupSchema);

  db.Users = mongooseModels.User.collection;
  db.Tags = mongooseModels.Tag.collection;
  db.Posts = mongooseModels.Post.collection;
  db.PostsCategories = mongooseModels.PostsCategory.collection;
  db.Comments = mongooseModels.Comment.collection;
  db.Groups = mongooseModels.Group.collection;
}
