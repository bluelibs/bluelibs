// Create a kernel with a bundle

import { Kernel, ContainerInstance } from "@bluelibs/core";
import { EmailBundle } from "../EmailBundle";
import { LoggerBundle } from "@bluelibs/logger-bundle";
import { IEmailBundleConfig } from "../defs";

export async function createEcosystem(
  config: Partial<IEmailBundleConfig>
): Promise<ContainerInstance> {
  const kernel = new Kernel({
    bundles: [new LoggerBundle(), new EmailBundle(config)],
    parameters: {
      testing: true,
    },
  });

  await kernel.init();

  return kernel.container;
}
