import { getEcosystem } from "../helpers";
import { Comments } from "./dummy/comments";
import { Posts } from "./dummy/posts";
import { Users, User } from "./dummy/users";
import {
  BeforeInsertEvent,
  AfterInsertEvent,
  BeforeUpdateEvent,
  AfterUpdateEvent,
} from "../../events";
import { DatabaseService } from "../../services/DatabaseService";

describe("DatabaseService", () => {
  test("Should work with transaction throwing an exception", async () => {
    const { container } = await getEcosystem();

    const comments = container.get<Comments>(Comments);
    const posts = container.get<Posts>(Posts);
    const users = container.get<Users>(Users);

    await users.deleteMany({});
    const errorHandler = () => {
      throw new Error("oops?");
    };
    posts.on(AfterInsertEvent, errorHandler);

    const dbService = container.get(DatabaseService);

    let u1,
      p1,
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
        p1 = await posts.insertOne(
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

    posts.localEventManager.removeListener(AfterInsertEvent, errorHandler);
  });
});
