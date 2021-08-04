import { createEcosystem } from "../helpers";
import { Comments } from "./dummy/comments";
import { Posts } from "./dummy/posts";
import { Users, User } from "./dummy/users";
import { assert, expect } from "chai";
import {
  BeforeInsertEvent,
  AfterInsertEvent,
  BeforeUpdateEvent,
  AfterUpdateEvent,
  BeforeRemoveEvent,
  AfterRemoveEvent,
} from "../../events";
import { DatabaseService } from "../../services/DatabaseService";

describe("DatabaseService", () => {
  it("Should work with transaction", async () => {
    const { container, teardown } = await createEcosystem();

    const comments = container.get<Comments>(Comments);
    const posts = container.get<Posts>(Posts);
    const users = container.get<Users>(Users);

    await users.deleteMany({});

    posts.on(AfterInsertEvent, () => {
      throw new Error("oops?");
    });

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
      assert.isUndefined(u1);
    }

    assert.isTrue(caught);
    await teardown();
  });
});
