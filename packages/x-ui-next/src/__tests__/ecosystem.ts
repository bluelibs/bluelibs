import { createSampleKernel } from "./samples";

export const kernel = createSampleKernel();

export const container = kernel.container;

async function createEcosystem() {
  await kernel.init();
}

beforeAll(async () => {
  await createEcosystem();
});
