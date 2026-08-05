import { RegistrationInput } from "../inputs/RegistrationInput";
import { ChangePasswordInput } from "../inputs/ChangePasswordInput";
import { LoginInput } from "../inputs/LoginInput";
import { ResetPasswordInput } from "../inputs/ResetPasswordInput";
import { ForgotPasswordInput } from "../inputs/ForgotPasswordInput";
import { VerifyEmailInput } from "../inputs/VerifyEmailInput";
import { UserId } from "@bluelibs/security-bundle";

export interface IXPasswordService {
  /**
   * Registers the user with email as username and
   * @param input
   */
  register(
    input: RegistrationInput
  ): Promise<{ token: string | null; userId: UserId }>;
  changePassword(input: ChangePasswordInput, userId: UserId): Promise<void>;
  login(input: LoginInput): Promise<{ token: string }>;
  logout(token: string): Promise<void>;
  resetPassword(input: ResetPasswordInput): Promise<{ token: string }>;
  forgotPassword(input: ForgotPasswordInput): Promise<void>;
  verifyEmail(input: VerifyEmailInput): Promise<{ token: string }>;
  /**
   * This function will generate a token and send for validation via email verification. It can be later verified using verifyEmail method
   * @param userId The id of the user
   * @param name The name of the user
   * @param email
   */
  sendEmailVerification(
    userId: UserId,
    name: string,
    email: string
  ): Promise<void>;
  /**
   * This function will generate a token and send for validation via email verification. It can be later verified using verifyEmail method
   * @param userId The id of the user
   * @param name The name of the user
   * @param email
   */
  sendWelcomeEmail(name: string, email: string): Promise<void>;
  /**
   * Generates the token for email validation and maybe others
   * @param length
   */
  generateToken(length: number): string;
}
