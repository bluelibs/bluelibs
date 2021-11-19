import { Kernel } from "@bluelibs/core";
import { XUINextBundle } from "@bluelibs/x-ui-next";
import { UIAppBundle } from "../bundles/UIAppBundle/UIAppBundle";
import env from "../env";

export const kernel = new Kernel({
  bundles: [
    new XUINextBundle({
      apollo: {
        client: {
          uri: env.API_URL,
        },
      },
    }),
    new UIAppBundle(),
  ],
});

export const container = kernel.container;
