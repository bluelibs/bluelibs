import { Exception } from "@bluelibs/core";

export class UsernameAlreadyExistsException extends Exception<{
  username: string;
}> {
  getMessage() {
    const { username } = this.data;

    return `Username "${username}" already exists`;
  }

  getCode() {
    return "USERNAME_EXISTS";
  }
}
export class CooldownException extends Exception<{
  context: "login" | "reset-password";
}> {
  getMessage() {
    const { context } = this.data;

    return `In cooldown mode for ${context}.`;
  }

  getCode() {
    return "COOLDOWN_MODE";
  }
}

export class PasswordResetExpiredException extends Exception {
  getMessage() {
    return "Password reset attempt has expired.";
  }

  getCode() {
    return "PASSWORD_RESET_EXPIRED";
  }
}

export class ResetPasswordInvalidTokenException extends Exception {
  getMessage() {
    return "Token is invalid.";
  }

  getCode() {
    return "PASSWORD_RESET_INVALID_TOKEN";
  }
}
