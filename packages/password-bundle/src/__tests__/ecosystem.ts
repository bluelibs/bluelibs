import { SecurityBundle } from "@bluelibs/security-bundle";
import { ContainerInstance, Kernel, Bundle } from "@bluelibs/core";
import { PasswordBundle } from "../PasswordBundle";
import { IPasswordBundleConfig } from "../defs";

export async function createEcosystem(
  passwordBundleConfig?: IPasswordBundleConfig
): Promise<{ container: ContainerInstance; teardown: () => void }> {
  const kernel = new Kernel();

  class AppBundle extends Bundle {
    async init() {}
  }

  // session.cleanup registers a never-cleared 24h setInterval that keeps the
  // jest worker's event loop alive, hanging the test run.
  kernel.addBundle(new SecurityBundle({ session: { cleanup: false } }));
  kernel.addBundle(new PasswordBundle(passwordBundleConfig));
  kernel.addBundle(new AppBundle());

  await kernel.init();

  return {
    container: kernel.container,
    teardown: () => {},
  };
}
