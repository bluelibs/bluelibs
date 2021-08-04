import { Bundle } from "@bluelibs/core";
import { IPasswordBundleConfig } from "./defs";
import { HASHER_SERVICE_TOKEN, BUNDLE_CONFIG_TOKEN } from "./constants";
import { HasherService } from "./services/HasherService";

export class PasswordBundle extends Bundle<IPasswordBundleConfig> {
  defaultConfig = {
    failedAuthenticationAttempts: {
      lockAfter: 10,
      cooldown: "10m",
    },
    resetPassword: {
      cooldown: "5m", // zeit/ms
      expiresAfter: "2h", // zeit/ms
    },
  };

  async prepare() {
    this.container.set({
      id: HASHER_SERVICE_TOKEN,
      type: HasherService,
    });

    this.container.set({
      id: BUNDLE_CONFIG_TOKEN,
      value: this.config,
    });
  }
}
