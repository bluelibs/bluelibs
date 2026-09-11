import { UserId } from "@bluelibs/security-bundle";

export class AuthenticationCodes {
  code: string;

  leftSubmissionsCount?: number;

  expiresAt?: string | number | Date;

  userId: UserId;
}
