import { getEcosystem } from "../helpers";
import { Comments } from "./dummy/comments";
import { Posts } from "./dummy/posts";
import { Users, User } from "./dummy/users";

import { DatabaseService } from "../../services/DatabaseService";
import { MigrationService } from "../../services/MigrationService";

describe("Migrations", () => {
  test("Should work with basic migration and ensure all run", async () => {
    const { container } = await getEcosystem();

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
    expect(status.version).toBe(2);
    expect(await posts.countDocuments()).toBe(2);

    await migrationService.migrateTo(1);
    expect(await posts.countDocuments()).toBe(1);

    await migrationService.migrateTo(0);
    expect(await posts.countDocuments()).toBe(0);

    await migrationService.migrateToLatest();
    expect(await posts.countDocuments()).toBe(2);
  });

  test("Should have sanity checks for adding migrations", async () => {
    const { container } = await getEcosystem();

    const migrationService = container.get(MigrationService);

    migrationService.add({
      name: "Add a new post",
      version: 1,
      async up() {},
      async down() {},
    });

    expect(() => {
      migrationService.add({
        name: "Add a new post",
        version: 1,
        async up() {},
        async down() {},
      });
    }).toThrowError();

    expect(() => {
      migrationService.add({
        name: "Add a new post",
        version: 0,
        async up() {},
        async down() {},
      });
    }).toThrow();
  });

  test("Ensure offset works", async () => {
    const { container } = await getEcosystem();

    const comments = container.get<Comments>(Comments);
    const posts = container.get<Posts>(Posts);
    const users = container.get<Users>(Users);

    const migrationService = container.get(MigrationService);

    function add(version: number) {
      migrationService.add({
        name: "Add a new post",
        version,
        async up() {
          await posts.insertOne({
            title: `Post ${version}`,
          });
        },
        async down() {
          await posts.deleteOne({
            title: `Post ${version}`,
          });
        },
      });
    }
    add(1);
    add(2);
    add(3);
    // make the 3 adds above into a function that runs in a loop to i
    // and then run the test again
    await migrationService.migrateToLatest();
    await migrationService.migrateTo(2);
    expect(await posts.countDocuments({ title: "Post 1" })).toBe(1);
    expect(await posts.countDocuments({ title: "Post 2" })).toBe(1);
    expect(await posts.countDocuments()).toBe(2);
  });
});
