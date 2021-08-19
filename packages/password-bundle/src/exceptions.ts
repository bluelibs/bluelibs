import { Exception } from "@bluelibs/core";

export class UsernameAlreadyExistsException extends Exception<{
  username: string;
}> {
  getMessage() {
    const { username } = this.data;

    return `Username "${username}" already exists`;
  }
}
export class CooldownException extends Exception<{
  context: "login" | "reset-password";
}> {
  getMessage() {
    const { context } = this.data;

    return `In cooldown mode for ${context}.`;
  }
}

export class PasswordResetExpiredException extends Exception {
  getMessage() {
    return "Password reset attempt has expired.";
  }
}

export class ResetPasswordInvalidTokenException extends Exception {
  getMessage() {
    return "Token is invalid.";
  }
}
