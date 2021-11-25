import { Exception } from "@bluelibs/core";

export class InvalidUsernameException extends Exception<{ username: string }> {
  getMessage() {
    return `The username could not be found.`;
  }

  getCode() {
    return "INVALID_USERNAME"
  }
}
