import { Token } from "@bluelibs/core";

export const NODEMAILER_INSTANCE = new Token();
export const NODEMAILER_TEST_MODE = new Token();
export const EMAIL_DEFAULTS = new Token();
export const IMPLICIT_TRANSPORTS = ["console", "nodemailer-test"];
