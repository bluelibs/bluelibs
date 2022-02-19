import { Token } from "@bluelibs/core";

export const X_AUTH_SETTINGS = new Token("x-auth-settings");
export const SOCIAL_AUTH_SERVICE_TOKEN = new Token();
export const MULTIPLE_FACTORS_AUTH = new Token();
export const AUTH_CODE_COLLECTION_TOKEN = new Token("authe-code-collection");

export const MAGIC_AUTH_STRATEGY = "magic-link-auth";
export const PASSWORD_STRATEGY = "password";
export const SOCIAL_AUTH_STRATEGY = "social-auth";
export const MULTIPLE_FACTOR_STRATEGY = "multiple-factor";
