import { Token } from "@bluelibs/core";
import { IHasherService, IPasswordBundleConfig } from "./defs";

export const BUNDLE_CONFIG_TOKEN = new Token<IPasswordBundleConfig>(
  "PASSWORD_BUNDLE::PASSWORD_BUNDLE_CONFIG"
);
export const HASHER_SERVICE_TOKEN = new Token<IHasherService>(
  "PASSWORD_BUNDLE::HASHER_SERVICE"
);
