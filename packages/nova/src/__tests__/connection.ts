import * as mongodb from "mongodb";

export const client = new mongodb.MongoClient(
  "mongodb://localhost:27017/test",
  {
    // useUnifiedTopology: true,
  }
);
