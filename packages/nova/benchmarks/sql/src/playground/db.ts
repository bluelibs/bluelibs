import { addLinks, addSchema, t } from "@bluelibs/nova";
import { Collection, MongoClient } from "mongodb";
// Connection URI
const DB = "playground";
// const MONGO_URI = `mongodb://18.156.171.158:25000/${DB}`;
const MONGO_URI = `mongodb://localhost:27017/${DB}`;

// Create a new MongoClient
const client = new MongoClient(MONGO_URI, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  poolSize: 10,
});

export const db: {
  UserGameStats: Collection;
} = {
  UserGameStats: null,
};

export async function setup() {
  await client.connect();
  const clientDb = client.db(DB);

  db.UserGameStats = await clientDb.collection("userGameStats");

  const statSchema = t.schema({
    level: t.number,
    exp: t.number,
  });

  addSchema(
    db.UserGameStats,
    t.schema({
      username: t.string,
      email: t.string,
      scrap: t.number,
      eneregy: t.schema({
        timestamp: t.date,
        value: t.number,
      }),
      food: t.schema({
        cooldown: t.number,
      }),
      expedition: t.schema({
        cooldown: t.number,
        unlocked: t.boolean,
      }),
      equipped: t.schema({
        pet: t.boolean,
        car: t.boolean,
        hand: t.boolean,
        offhand: t.boolean,
        head: t.boolean,
        chest: t.boolean,
        boots: t.boolean,
      }),
      location: t.schema({
        id: t.number,
        arriveAt: t.date,
      }),
      stats: t.schema({
        intelligence: statSchema,
        agility: statSchema,
        strength: statSchema,
        defense: statSchema,
      }),
    })
  );
}
