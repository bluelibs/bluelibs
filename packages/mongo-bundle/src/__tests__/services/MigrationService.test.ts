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
import { MigrationService } from "../../services/MigrationService";

describe("Migrations", () => {
  it("Should work with basic migration and ensure all run", async () => {
    const { container, teardown } = await createEcosystem();

    const comments = container.get<Comments>(Comments);
    const posts = container.get<Posts>(Posts);
    const users = container.get<Users>(Users);

    const migrationService = container.get(MigrationService);
    migrationService.add({
      name: "Add a new post",
      version: 1,
      async up() {
        await posts.insertOne({
          title: "Post 1",
        });
      },
      async down() {
        await posts.deleteOne({
          title: "Post 1",
        });
      },
    });
    migrationService.add({
      name: "Add a new post",
      version: 2,
      async up() {
        await posts.insertOne({
          title: "Post 2",
        });
      },
      async down() {
        await posts.deleteOne({
          title: "Post 2",
        });
      },
    });

    await migrationService.migrateToLatest();
    const status = await migrationService.getStatus();
    assert.equal(status.version, 2);
    assert.equal(await posts.find().count(), 2);

    await migrationService.migrateTo(1);
    assert.equal(await posts.find().count(), 1);

    await migrationService.migrateTo(0);
    assert.equal(await posts.find().count(), 1);

    await migrationService.migrateToLatest();
    assert.equal(await posts.find().count(), 2);

    await teardown();
  });

  it("Should have sanity checks for adding migrations", async () => {
    const { container, teardown } = await createEcosystem();

    // const comments = container.get<Comments>(Comments);
    // const posts = container.get<Posts>(Posts);
    // const users = container.get<Users>(Users);

    const migrationService = container.get(MigrationService);

    migrationService.add({
      name: "Add a new post",
      version: 1,
      async up() {},
      async down() {},
    });

    assert.throws(() => {
      migrationService.add({
        name: "Add a new post",
        version: 1,
        async up() {},
        async down() {},
      });
    }, "You already have a migration added with this version.");

    assert.throws(() => {
      migrationService.add({
        name: "Add a new post",
        version: 0,
        async up() {},
        async down() {},
      });
    });

    await teardown();
  });
});
