import { Exception } from "@bluelibs/core";

export class InvalidPasswordException extends Exception {
  getMessage() {
    return "Username or password are invalid.";
  }

  getCode() {
    return "INVALID_PASSWORD";
  }
}
