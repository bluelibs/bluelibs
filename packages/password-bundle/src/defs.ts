import {
  IFieldMap,
  FindAuthenticationStrategyResponse,
  UserId,
} from "@bluelibs/security-bundle";

export interface IPasswordBundleConfig {
  failedAuthenticationAttempts?: {
    lockAfter?: number;
    cooldown?: string; // zeit/ms
  };
  resetPassword?: {
    cooldown?: string; // zeit/ms
    expiresAfter?: string; // zeit/ms
  };
}

export interface IPasswordService {
  attach(
    userId: UserId,
    options: IPasswordAuthenticationStrategyCreationOptions
  ): Promise<void>;
  isPasswordValid(
    userId: UserId,
    password: string,
    options?: IPasswordValidationOptions
  ): Promise<boolean>;
  findUserIdByUsername(username: string): Promise<any>;
  createTokenForPasswordReset(userId: UserId): Promise<string>;
  isResetPasswordTokenValid(userId: UserId, token: string): Promise<boolean>;
  resetPassword(
    userId: UserId,
    token: string,
    newPassword: string
  ): Promise<void>;
  setPassword(userId: UserId, password: string): Promise<void>;
  setUsername(userId: UserId, username: string): Promise<void>;

  /**
   * Helper method to get data easier
   */
  getData(
    userId,
    fields?: IFieldMap
  ): Promise<Partial<IPasswordAuthenticationStrategy>>;

  /**
   * Helper method to easily update the password data
   */
  updateData(
    userId,
    data: Partial<IPasswordAuthenticationStrategy>
  ): Promise<void>;
}

export interface IHasherService {
  generateSalt(userId?: any): string;
  getHashedPassword(plainPassword, salt?: string): string;
  generateToken(userId?: any): string;
}

export interface IPasswordAuthenticationStrategyCreationOptions {
  username: string;
  email?: string;
  isEmailVerified?: boolean;
  password: string;
}

export interface IPasswordValidationOptions {
  failedAuthenticationAttemptsProcessing: boolean; // Bounty, find a better name.
}

export interface IPasswordAuthenticationStrategy {
  username: string;
  email?: string;

  isEmailVerified?: boolean;
  emailVerificationToken?: string;

  // Unique salt per user
  salt: string;
  passwordHash: string;
  lastSuccessfulPasswordValidationAt: Date;

  // Resetting the password
  resetPasswordVerificationToken: string; // optional when resetting the password
  resetPasswordRequestedAt: Date;

  // Failed login attempts
  currentFailedLoginAttempts: number;
  lastFailedLoginAttemptAt: Date;
}
