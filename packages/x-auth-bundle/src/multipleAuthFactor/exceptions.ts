import { Exception } from "@bluelibs/core";

export class SessionNotFound extends Exception {
  static code = "SESSION_NOTFOUND_EXPIRED";

  getMessage() {
    return "Session not found or has expired";
  }
}

export class UserSessionError extends Exception {
  static code = "SESSION_USER_ERROR";

  getMessage() {
    return "session not user's";
  }
}

export class UnValidFactorStrategy extends Exception {
  static code = "UNVALID_FACTOR_STRATEGY";

  getMessage() {
    return "unvalid factor strategy";
  }
}
