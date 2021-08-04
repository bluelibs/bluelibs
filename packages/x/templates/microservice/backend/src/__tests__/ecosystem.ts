/**
 * When testing we use the same kernel as the final integration.
 * This file exports { kernel, container } that can be used to test your services in bundles
 *
 * If you want custom env variables for testing, we suggest
 * creating an ".env.test" and controlling "env.ts" file to
 * load it based on process.env.NODE_ENV
 */
import { kernel } from "../startup/kernel";
import "../startup/bundles";

const container = kernel.container;

export { container, kernel };

export async function createEcosystem() {
  await kernel.init();
}

beforeAll(async () => {
  await createEcosystem();
});

afterAll(async () => {
  // We have no idea how other processes might have some hanging things like db requests or others
  // It is a good idea to wait 1s before shutting the kernel down so we avoid weird errors
  return new Promise((resolve) => {
    setTimeout(() => {
      kernel.shutdown().then(resolve);
    }, 1000);
  });
});
