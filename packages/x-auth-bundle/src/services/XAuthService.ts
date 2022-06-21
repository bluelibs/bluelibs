import {
  SecurityService,
  UserId,
  ICreateSessionOptions,
  ISession,
} from "@bluelibs/security-bundle";
import { PasswordService } from "@bluelibs/password-bundle";
import { EmailService } from "@bluelibs/email-bundle";
import { Service, Inject, ContainerInstance } from "@bluelibs/core";
import { InvalidPasswordException } from "../exceptions/InvalidPasswordException";
import { IXAuthService } from "./IXAuthService";
import { InvalidTokenException } from "../exceptions/InvalidTokenException";
import { RegistrationInput } from "../inputs/RegistrationInput";
import { ChangePasswordInput } from "../inputs/ChangePasswordInput";
import { LoginInput } from "../inputs/LoginInput";
import { ResetPasswordInput } from "../inputs/ResetPasswordInput";
import { ForgotPasswordInput } from "../inputs/ForgotPasswordInput";
import { VerifyEmailInput } from "../inputs/VerifyEmailInput";
import { Router, APP_ROUTER } from "@bluelibs/x-bundle";
import { IXAuthBundleConfig } from "../defs";
import {
  AUTH_CODE_COLLECTION_TOKEN,
  MAGIC_AUTH_STRATEGY,
  PASSWORD_STRATEGY,
  X_AUTH_SETTINGS,
} from "../constants";
import { InvalidUsernameException } from "../exceptions/InvalidUsernameException";
import {
  SubmissionCountExceededException,
  UsernameAlreadyExistsException,
} from "../exceptions";
import {
  RequestLoginLinkInput,
  VerifyMagicLinkInput,
} from "../inputs/RequestMagicLinkInput";
import { ObjectId } from "mongodb";
import { MultipleFcatorRedirect } from "../multipleAuthFactor/defs";
import { MultipleFactorService } from "../multipleAuthFactor/MultipleFactorService";
import { AuthenticationCodesCollection } from "../collections/AuthenticationCodes.collection";
import * as ms from "ms";
import { AuthenticationCodes } from "../collections/AuthenticationCodes.model";
import { CodeSubmissionExceededException } from "../exceptions/CodeSubmissionExceededException";

const ALLOWED_CHARS =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890".split("");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Service()
export class XAuthService implements IXAuthService {
  constructor(
    protected readonly container: ContainerInstance,
    @Inject(APP_ROUTER)
    protected readonly router: Router,
    protected readonly securityService: SecurityService,
    protected readonly passwordService: PasswordService,
    protected readonly emailService: EmailService,
    @Inject(X_AUTH_SETTINGS)
    protected readonly config: IXAuthBundleConfig,
    @Inject(AUTH_CODE_COLLECTION_TOKEN)
    protected readonly authenticationCodeCollection: AuthenticationCodesCollection,
    protected readonly multipleFactorService: MultipleFactorService
  ) {}

  /**
   * Registers the user with email as username.
   * @param input
   */
  async register(
    input: RegistrationInput
  ): Promise<{ token: string; userId: UserId }> {
    const existingUserId = await this.passwordService.findUserIdByUsername(
      input.email
    );
    if (existingUserId) {
      throw new UsernameAlreadyExistsException();
    }
    const userId = await this.securityService.createUser();
    const {
      requiresEmailVerificationBeforeLoggingIn,
      emails: { sendEmailVerification, sendWelcomeEmail },
    } = this.config;

    await this.passwordService.attach(userId, {
      username: input.email,
      email: input.email,
      password: input.password,
      isEmailVerified: false,
    });

    await this.securityService.updateUser(userId, {
      profile: {
        firstName: input.firstName,
        lastName: input.lastName,
      },
      isEnabled: requiresEmailVerificationBeforeLoggingIn ? false : true,
    });

    // The logic here would be that we send email verification, without welcoming
    // However if
    if (sendEmailVerification) {
      await this.sendEmailVerification(userId, input.firstName, input.email);
    }

    // If it's not mandatory to have his email checked and we don't send email verification
    // we'll send the welcome email. If we do send verification email, the welcome email is sent after email is verified
    if (
      sendWelcomeEmail &&
      !sendEmailVerification &&
      !requiresEmailVerificationBeforeLoggingIn
    ) {
      await this.sendWelcomeEmail(input.firstName, input.email);
    }

    let token = null;
    if (!requiresEmailVerificationBeforeLoggingIn) {
      token = await this.securityService.login(userId, {
        authenticationStrategy: PASSWORD_STRATEGY,
      });
    }

    return {
      userId,
      token: requiresEmailVerificationBeforeLoggingIn ? null : token,
    };
  }

  async changePassword(input: ChangePasswordInput, userId: UserId) {
    const isValid = await this.passwordService.isPasswordValid(
      userId,
      input.oldPassword,
      {
        failedAuthenticationAttemptsProcessing: false,
      }
    );

    if (!isValid) {
      throw new Error("Old password was invalid");
    }

    await this.passwordService.setPassword(userId, input.newPassword);
  }

  async login(
    input: LoginInput
  ): Promise<{ token: string } | MultipleFcatorRedirect> {
    const userId = await this.passwordService.findUserIdByUsername(
      input.username
    );

    if (!userId) {
      throw new InvalidUsernameException({ username: input.username });
    }

    const isValid = await this.passwordService.isPasswordValid(
      userId,
      input.password
    );

    if (isValid) {
      return await this.multipleFactorService.login(userId, {
        authenticationStrategy: PASSWORD_STRATEGY,
      });
    } else {
      throw new InvalidPasswordException();
    }
  }

  async logout(token) {
    await this.securityService.logout(token);
  }

  async resetPassword(input: ResetPasswordInput) {
    const userId = await this.passwordService.findUserIdByUsername(
      input.username
    );

    await this.passwordService.resetPassword(
      userId,
      input.token,
      input.newPassword
    );

    return {
      token: await this.securityService.login(userId, {
        authenticationStrategy: PASSWORD_STRATEGY,
      }),
    };
  }

  async forgotPassword(input: ForgotPasswordInput) {
    const userId = await this.passwordService.findUserIdByUsername(input.email);

    if (!userId) {
      // We don't want to expose if we have the user or not, so we "silently" fail
      // We want to emulate some "time" passing so they don't do time-based analysis of user email detection
      await sleep(150);
      return;
    }

    const token = await this.passwordService.createTokenForPasswordReset(
      userId
    );

    this.sendResetPasswordEmail(input.email, input.email, token);
  }

  /**
   * Sends the reset password email with the specified token
   *
   * @param name
   * @param email
   * @param token
   */
  public async sendResetPasswordEmail(
    name: string,
    email: string,
    token: string
  ): Promise<void> {
    const {
      emails: { regardsName, paths, templates },
    } = this.config;

    // This will run in the background, we do not await on emails
    await this.emailService.send(
      {
        component: templates.forgotPassword,
        props: {
          name: name,
          username: email,
          regardsName: regardsName,
          resetPasswordUrl: this.router.path(paths.resetPasswordPath, {
            token,
          }),
        },
      },
      {
        to: email,
      }
    );
  }

  async verifyEmail(input: VerifyEmailInput): Promise<{ token: string }> {
    if (input.username) {
      // This one is optional
      const userId = await this.passwordService.findUserIdByUsername(
        input.username
      );

      if (!userId) {
        throw new Error("invalid-username");
      }
    }

    const result = await this.securityService.findThroughAuthenticationStrategy(
      PASSWORD_STRATEGY,
      {
        emailVerificationToken: input.token,
      }
    );

    if (!result) {
      throw new InvalidTokenException({
        context: "email-verification",
      });
    }

    if (input.token === result.strategy.emailVerificationToken) {
      // When token matches successfully
      await this.passwordService.updateData(result.userId, {
        isEmailVerified: true,
        emailVerificationToken: null,
      });

      const { requiresEmailVerificationBeforeLoggingIn } = this.config;
      if (requiresEmailVerificationBeforeLoggingIn) {
        await this.securityService.updateUser(result.userId, {
          isEnabled: true,
        });
      }

      if (this.config.emails.sendWelcomeEmail) {
        const userData = await this.securityService.findUserById(
          result.userId,
          {
            profile: 1,
            password: 1,
          }
        );

        this.sendWelcomeEmail(
          userData.profile.firstName,
          userData.password?.username
        );
      }
    }

    return {
      token: await this.securityService.login(result.userId, {
        authenticationStrategy: PASSWORD_STRATEGY,
      }),
    };
  }

  /**
   * This function will generate a token and send for validation via email verification. It can be later verified using verifyEmail method
   * @param userId The id of the user
   * @param name The name of the user
   * @param email
   */
  async sendEmailVerification(userId: UserId, name: string, email: string) {
    const token = this.generateToken(32);
    this.passwordService.updateData(userId, {
      emailVerificationToken: token,
    });

    const {
      emails: { regardsName, paths, templates },
    } = this.config;

    // This will run in the background
    this.emailService.send(
      {
        component: templates.verifyEmail,
        props: {
          name: name,
          regardsName: regardsName,
          verifyEmailUrl: this.router.path(paths.verifyEmailPath, { token }),
        },
      },
      {
        to: email,
      }
    );
  }

  /**
   * This function will generate a token and send for validation via email verification. It can be later verified using verifyEmail method
   * @param userId The id of the user
   * @param name The name of the user
   * @param email
   */
  async sendWelcomeEmail(name: string, email: string) {
    const {
      emails: { regardsName, paths, templates, applicationName },
    } = this.config;

    // This will run in the background
    this.emailService.send(
      {
        component: templates.welcome,
        props: {
          name: name,
          applicationName: applicationName,
          regardsName: regardsName,
          welcomeUrl: this.router.path(paths.welcomePath),
        },
      },
      {
        to: email,
      }
    );
  }

  /**
   * Generates the token for email validation and maybe others
   * @param length
   */
  generateToken(length, chars?: string[]) {
    const b = [];
    if (!chars) {
      chars = ALLOWED_CHARS;
    }
    for (let i = 0; i < length; i++) {
      const j = (Math.random() * (chars.length - 1)).toFixed(0);
      b[i] = chars[j];
    }
    return b.join("");
  }

  async requestLoginLink(input: RequestLoginLinkInput): Promise<any> {
    const userId = input.userId
      ? new ObjectId(input.userId)
      : await this.passwordService.findUserIdByUsername(input.username);
    const user = await this.securityService.findUserById(userId, {
      profile: 1,
    });
    if (!userId || !user) {
      throw new InvalidUsernameException({ username: input.username });
    }

    if (input.type === "sms") {
      //sms implementation
      await this.sendEmailMagicLink(userId, user.profile.firstName, input);
    } else if (input.type === "email") {
      //sms call implementation
      await this.sendEmailMagicLink(userId, user.profile.firstName, input);
    } else {
      await this.sendEmailMagicLink(userId, user.profile.firstName, input);
    }
    return {
      magicCodeSent: true,
      userId,
      method: input.type,
      confirmationFormat: this.config.magicAuthFormat,
    };
  }

  async verifyMagicCode(
    input: VerifyMagicLinkInput
  ): Promise<{ token: string } | MultipleFcatorRedirect> {
    const magicCode: string = input.magicCode,
      userId: UserId = ObjectId(input.userId);
    const session = await this.getConfirmationSession(magicCode, userId);

    if (!session) throw new Error("invalid-magic-code");

    //delete the session after usage
    await this.securityService.logout(magicCode);

    return await this.multipleFactorService.login(userId, {
      authenticationStrategy: MAGIC_AUTH_STRATEGY,
    });
  }

  async sendEmailMagicLink(
    userId: UserId,
    name: string,
    input: RequestLoginLinkInput
  ) {
    const magicCode =
      this.config.magicAuthFormat === "code"
        ? this.generateToken(6, "0123456789".split(""))
        : this.generateToken(24);

    await this.createConfirmationSession({
      userId,
      code: magicCode,
      leftSubmissionsCount: this.config.leftSubmissionsCount,
      expiresAt: new Date(Date.now() + ms(this.config.magicCodeLifeDuration)),
    });

    const {
      emails: { regardsName, paths, templates },
    } = this.config;

    // This will run in the background
    this.emailService.send(
      {
        component: templates.requestMagicLink,
        props: {
          name: name,
          regardsName: regardsName,
          username: input.username,
          magicLink: this.router.path(
            paths.submitMagicCode + `?userId=${userId}&code=${magicCode}`
          ),
          code: this.config.magicAuthFormat === "code" ? magicCode : undefined,
        },
      },
      {
        to: input.username,
      }
    );
  }

  async createConfirmationSession(
    codeAuthSession: AuthenticationCodes
  ): Promise<string> {
    await this.excessiveUse(codeAuthSession.userId);
    await this.authenticationCodeCollection.deleteMany({
      userId: codeAuthSession.userId,
    });
    await this.authenticationCodeCollection.insertOne(codeAuthSession);

    return codeAuthSession.code;
  }

  async getConfirmationSession(
    code: string,
    userId: UserId
  ): Promise<AuthenticationCodes | null> {
    await this.excessiveUse(userId);
    const authcodeSession = await this.authenticationCodeCollection.findOne({
      userId,
      expiresAt: { $gte: new Date(Date.now()) },
    });

    if (!authcodeSession) {
      return null;
    } else if (authcodeSession.code !== code) {
      await this.authenticationCodeCollection.updateOne(
        { userId, code: authcodeSession.code },
        {
          $set: {
            leftSubmissionsCount: Math.max(
              0,
              authcodeSession.leftSubmissionsCount - 1
            ),
          },
        }
      );
      return null;
    }
    if (authcodeSession?.leftSubmissionsCount === 0) {
      throw new SubmissionCountExceededException();
    }
    await this.authenticationCodeCollection.deleteOne({
      userId,
      code,
    });
    return authcodeSession;
  }

  async excessiveUse(userId: UserId) {
    const authcodeSession = await this.authenticationCodeCollection.findOne({
      userId,
      leftSubmissionsCount: 0,
      expiresAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });
    if (authcodeSession) throw new CodeSubmissionExceededException();
  }
}
