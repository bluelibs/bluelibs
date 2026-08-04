import { getEcosystem } from "../helpers";
import { Posts } from "./dummy/posts";
import { Users } from "./dummy/users";
import { AfterInsertEvent } from "../../events";
import { DatabaseService } from "../../services/DatabaseService";

describe("DatabaseService", () => {
  test("Should work with transaction throwing an exception", async () => {
    const { container } = await getEcosystem();

    const posts = container.get<Posts>(Posts);
    const users = container.get<Users>(Users);

    // Ensure the collections are fully initialised (indexes created) before the
    // transaction so no background operation races with client shutdown.
    await posts.countDocuments({});
    await users.deleteMany({});

    const errorHandler = () => {
      throw new Error("oops?");
    };
    posts.on(AfterInsertEvent, errorHandler);

    const dbService = container.get(DatabaseService);

    let u1,
      caught = false;

    try {
      await dbService.transact(async (session) => {
        u1 = await users.insertOne(
          {
            title: "TEST IN WEST",
          },
          {
            session,
          }
        );
        await posts.insertOne(
          {
            title: "FAIL AFTER IT",
          },
          {
            session,
          }
        );
      });
    } catch (e) {
      caught = true;
      expect(u1).toBeUndefined();
    }

    expect(caught).toBe(true);

    // @ts-expect-error - Event type compatibility
    posts.localEventManager.removeListener(AfterInsertEvent, errorHandler);
  });
});
