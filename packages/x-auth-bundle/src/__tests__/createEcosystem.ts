import { ContainerInstance, Kernel } from "@bluelibs/core";
import { GraphQLBundle } from "@bluelibs/graphql-bundle";
import { LoggerBundle } from "@bluelibs/logger-bundle";
import { XBundle } from "@bluelibs/x-bundle";
import { MongoBundle, DatabaseService } from "@bluelibs/mongo-bundle";
import { SecurityBundle } from "@bluelibs/security-bundle";
import { PasswordBundle } from "@bluelibs/password-bundle";
import { HTTPBundle } from "@bluelibs/http-bundle";
import { SecurityMongoBundle } from "@bluelibs/security-mongo-bundle";
import { XAuthBundle } from "..";
import { EmailBundle } from "@bluelibs/email-bundle";

// Jest runs each test file in its own worker process; give each worker its own
// HTTP port so parallel suites don't collide binding the same one.
export const PORT = 64022 + Number(process.env.JEST_WORKER_ID || 0);
export async function createEcosystem(configXAuthBundle = {}, port = PORT) {
  try {
    const kernel = new Kernel({
      bundles: [
        new LoggerBundle(),
        new GraphQLBundle(),
        new EmailBundle(),
        new HTTPBundle({
          port,
        }),
        new MongoBundle({
          uri: "mongodb://localhost:27017/test",
        }),
        new SecurityMongoBundle(),
        new SecurityBundle({
          // Session cleanup runs on a 24h setInterval that is never cleared,
          // keeping jest workers alive and causing teardown leaks in tests.
          session: { cleanup: false },
        }),
        new PasswordBundle(),

        new XAuthBundle(configXAuthBundle),
        new XBundle(),
      ],
      parameters: {
        testing: true,
      },
    });
    await kernel.init();

    return kernel.container;
  } catch (err) {
    throw err;
  }
}

/**
 * Shuts down the kernel created by createEcosystem.
 *
 * The MongoDB driver returns connections to the pool asynchronously after the
 * last operation. Closing the client while a connection is still checked out
 * makes `MongoClient.close()` error that connection with a
 * `MongoClientClosedError`, which can crash the Jest worker. Wait for the pool
 * to drain before closing the client.
 */
export async function shutdownKernel(container: ContainerInstance) {
  try {
    const client = container.get(DatabaseService).client;
    // why: the connection pool internals are private to the MongoDB driver
    // (topology is excluded from the public types), so we reach into them with
    // a structurally-typed cast.
    const topology = (
      client as unknown as {
        topology?: { s?: { servers?: Map<string, unknown> } };
      }
    )?.topology;
    const server = topology?.s?.servers?.values()?.next()?.value;
    const pool = (
      server as { pool?: { checkedOut?: { size: number } } } | undefined
    )?.pool;
    const deadline = Date.now() + 2000;
    while (pool?.checkedOut?.size > 0 && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  } catch {
    // Fall back to a short settle delay if the pool can't be inspected.
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  const kernel = container.get(Kernel);
  await kernel.shutdown();
}
