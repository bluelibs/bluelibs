import { Constructor, Token } from "@bluelibs/core";
import { GuardianSmart } from ".";

export const LOCAL_STORAGE_TOKEN_KEY = "bluelibs-token";

export const GUARDIAN_SMART_TOKEN = new Token<Constructor<GuardianSmart>>(
  "GUARDIAN_SMART"
);
