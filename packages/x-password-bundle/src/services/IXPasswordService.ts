import { RegistrationInput } from "../inputs/RegistrationInput";
import { ChangePasswordInput } from "../inputs/ChangePasswordInput";
import { LoginInput } from "../inputs/LoginInput";
import { ResetPasswordInput } from "../inputs/ResetPasswordInput";
import { ForgotPasswordInput } from "../inputs/ForgotPasswordInput";
import { VerifyEmailInput } from "../inputs/VerifyEmailInput";
import { UserId } from "@bluelibs/security-bundle";
import {
  RequestLoginLinkInput,
  VerifyMagicLinkInput,
} from "../inputs/RequestMagicLinkInput";

export interface IXPasswordService {
  /**
   * Registers the user with email as username and
   * @param input
   */
  register(input: RegistrationInput): any;
  changePassword(input: ChangePasswordInput, userId: UserId): any;
  login(input: LoginInput): any;
  logout(input): any;
  resetPassword(input: ResetPasswordInput): {};
  forgotPassword(input: ForgotPasswordInput): any;
  verifyEmail(input: VerifyEmailInput): {};
  /**
   * This function will generate a token and send for validation via email verification. It can be later verified using verifyEmail method
   * @param userId The id of the user
   * @param name The name of the user
   * @param email
   */
  sendEmailVerification(userId: UserId, name: string, email: string): any;
  /**
   * This function will generate a token and send for validation via email verification. It can be later verified using verifyEmail method
   * @param userId The id of the user
   * @param name The name of the user
   * @param email
   */
  sendWelcomeEmail(name: string, email: string): any;
  /**
   * Generates the token for email validation and maybe others
   * @param length
   */
  generateToken(length): any;
  requestLoginLink(input: RequestLoginLinkInput): any;
  verifyMagicCode(input: VerifyMagicLinkInput): any;
  sendEmailMagicLink(
    userId: UserId,
    name: string,
    input: RequestLoginLinkInput
  ): {};
}
