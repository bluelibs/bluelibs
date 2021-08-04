import { Exception } from "@bluelibs/core";

export class UsernameAlreadyExistsException extends Exception {
  getMessage() {
    return "Username already exists";
  }
}
