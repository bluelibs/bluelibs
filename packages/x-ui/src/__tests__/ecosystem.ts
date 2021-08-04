import { Kernel } from "@bluelibs/core";
import { XUIBundle } from "../XUIBundle";

export const sessionsConfig = {
  defaults: {
    lastAuthenticationDate: new Date("03-01-2000 00:00:00"),
  },
  localStorageKey: "BlueLibs_UI_SESSION",
};

export const kernel = new Kernel({
  parameters: {
    testing: true,
  },
  bundles: [
    new XUIBundle({
      session: sessionsConfig,
    }),
  ],
});

export const container = kernel.container;

async function createEcosystem() {
  await kernel.init();
}

beforeAll(async () => {
  return createEcosystem();
});
