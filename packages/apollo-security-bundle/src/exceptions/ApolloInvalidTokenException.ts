import { Exception } from "@bluelibs/core";

export class ApolloInvalidTokenException extends Exception<{ token: string }> {
  static code = "INVALID_TOKEN";

  getMessage() {
    return "Invalid token";
  }
}
