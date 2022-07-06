import { Token } from "@bluelibs/core";

export const NODEMAILER_INSTANCE = new Token(
  "EMAIL_BUNDLE::NODEMAILER_INSTANCE"
);
export const NODEMAILER_TEST_MODE = new Token(
  "EMAIL_BUNDLE::NODEMAILER_TEST_MODE"
);
export const EMAIL_DEFAULTS = new Token("EMAIL_BUNDLE::EMAIL_DEFAULTS");
export const IMPLICIT_TRANSPORTS = ["console", "nodemailer-test"];
