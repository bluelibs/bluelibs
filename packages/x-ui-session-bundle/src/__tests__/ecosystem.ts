import { createSampleKernel } from "./samples";

export const sessionsConfig = {
  defaults: {
    locale: "en",
  },
};

export const kernel = createSampleKernel();

export const container = kernel.container;

async function createEcosystem() {
  await kernel.init();
}

beforeAll(async () => {
  return createEcosystem();
});
