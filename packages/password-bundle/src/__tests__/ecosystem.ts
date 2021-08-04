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

  kernel.addBundle(new SecurityBundle());
  kernel.addBundle(new PasswordBundle(passwordBundleConfig));
  kernel.addBundle(new AppBundle());

  await kernel.init();

  return {
    container: kernel.container,
    teardown: () => {},
  };
}
