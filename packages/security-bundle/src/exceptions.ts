import { Exception } from "@bluelibs/core";

export class UserNotFoundException extends Exception {
  static code = "USER_NOT_FOUND";

  getMessage() {
    return "User not found";
  }
}

export class UserNotAuthorizedException extends Exception {
  static code = "USER_NOT_AUTHORIZED";

  getMessage() {
    return "User not authorized";
  }
}

export class UserDisabledException extends Exception {
  static code = "USER_DISABLED";

  getMessage() {
    return "User is disabled";
  }
}

export class SessionExpiredException extends Exception {
  static code = "SESSION_TOKEN_EXPIRED";

  getMessage() {
    return "Session has expired";
  }
}
