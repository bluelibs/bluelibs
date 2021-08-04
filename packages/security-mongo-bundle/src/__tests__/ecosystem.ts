import { createEcosystem } from "./createEcosystem";

export const ecosystem = createEcosystem();

afterEach(async () => {
  await (await ecosystem).cleanup();
});

afterAll(async () => {
  (await ecosystem).teardown();
});
