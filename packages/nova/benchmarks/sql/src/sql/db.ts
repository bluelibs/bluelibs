import { Sequelize, DataTypes } from "sequelize";
import * as knex from "knex";

// Remote
// const HOSTNAME = "18.156.171.158";
// const PORT = 25001;
// const USER = "postgres";
// const DB = "postgres";
// const PASSWORD = "myPassword";

// Localhost
const HOSTNAME = "localhost";
const PORT = 5432;
const USER = "theodor";
const DB = "postgres";
const PASSWORD = null;

export const sequelize = new Sequelize(`postgres://${HOSTNAME}:${PORT}/${DB}`, {
  username: USER,
  password: PASSWORD,
  dialect: "postgres",
  logging: false,
});

export const queryBuilder = knex({
  client: "pg",
  connection: {
    host: HOSTNAME,
    port: PORT,
    user: USER,
    password: PASSWORD,
    database: DB,
  },
});

// const ID_SIGNATURE = {
//   allowNull: false,
//   primaryKey: true,
//   type: DataTypes.UUIDV4,
// };

export const User = sequelize.define("user", {
  name: {
    type: DataTypes.TEXT,
  },
  email: {
    type: DataTypes.TEXT,
  },
  roles: {
    type: DataTypes.STRING,
  },
});

export const Tag = sequelize.define("tag", {
  name: DataTypes.STRING,
});

export const PostCategory = sequelize.define("postCategory", {
  name: DataTypes.STRING,
});

export const Post = sequelize.define("post", {
  title: DataTypes.TEXT,
  description: DataTypes.TEXT,
});

export const Group = sequelize.define("group", {
  name: DataTypes.STRING,
});

export const Comment = sequelize.define("comment", {
  text: DataTypes.TEXT,
});

// Define relationships

// User & Group
Group.belongsToMany(User, { as: "users", through: "UserGroup" });
User.belongsToMany(Group, { as: "groups", through: "UserGroup" });

// Tag & Post
Tag.belongsToMany(Post, { through: "PostTag" });
Post.belongsToMany(Tag, { through: "PostTag" });

// Post & PostCategory
PostCategory.hasMany(Post, { as: "posts" });
Post.belongsTo(PostCategory);

Post.hasMany(Comment, { as: "comments" });
Comment.belongsTo(Post);

// Post & User
User.hasMany(Post, { as: "posts" });
Post.belongsTo(User);

// Comment & User
Comment.belongsTo(User);
User.hasMany(Comment, { as: "comments" });
