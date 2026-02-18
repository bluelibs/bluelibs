import { Constructor, Token } from "@bluelibs/core";
import { GuardianSmart } from ".";

export const LOCAL_STORAGE_TOKEN_KEY = "bluelibs-token";

export const GUARDIAN_SMART_TOKEN = new Token<Constructor<GuardianSmart>>(
  "X_UI_GUARDIAN_BUNDLE::GUARDIAN_SMART"
);
export const GUARDIAN_IS_MULTIPLEFACTOR_AUTH = new Token<Boolean>(
  "GUARDIAN_IS_MULTIPLEFACTOR_AUTH"
);
