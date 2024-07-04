import { Token } from "@bluelibs/core";
import { IXUISessionBundleConfigType } from "./defs";

export const UI_SESSION_BUNDLE_CONFIG_TOKEN =
  new Token<IXUISessionBundleConfigType>(
    "X_UI_SESSION_BUNDLE::UI_SESSION_BUNDLE_CONFIG"
  );
