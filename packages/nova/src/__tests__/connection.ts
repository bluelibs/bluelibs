import * as mongodb from "mongodb";

export const client = new mongodb.MongoClient(
  process.env.TEST_DB ?? "mongodb://localhost:27017/test",
  {
    // useUnifiedTopology: true,
  }
);
