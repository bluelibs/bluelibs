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
import { IXPasswordService } from "./IXPasswordService";
import { InvalidTokenException } from "../exceptions/InvalidTokenException";
import { RegistrationInput } from "../inputs/RegistrationInput";
import { ChangePasswordInput } from "../inputs/ChangePasswordInput";
import { LoginInput } from "../inputs/LoginInput";
import { ResetPasswordInput } from "../inputs/ResetPasswordInput";
import { ForgotPasswordInput } from "../inputs/ForgotPasswordInput";
import { VerifyEmailInput } from "../inputs/VerifyEmailInput";
import { Router, APP_ROUTER } from "@bluelibs/x-bundle";
import { IXPasswordBundleConfig } from "../defs";
import {
  MAGIC_AUTH_STRATEGY,
  PASSWORD_STRATEGY,
  X_PASSWORD_SETTINGS,
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

const ALLOWED_CHARS =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890".split("");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Service()
export class XPasswordService implements IXPasswordService {
  constructor(
    protected readonly container: ContainerInstance,
    @Inject(APP_ROUTER)
    protected readonly router: Router,
    protected readonly securityService: SecurityService,
    protected readonly passwordService: PasswordService,
    protected readonly emailService: EmailService,
    @Inject(X_PASSWORD_SETTINGS)
    protected readonly config: IXPasswordBundleConfig,
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
        data: { sessionToken: input.sessionToken },
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
      sessionToken: input.sessionToken,
    };
  }

  async verifyMagicCode(
    input: VerifyMagicLinkInput
  ): Promise<{ token: string } | MultipleFcatorRedirect> {
    const magicCode: string = input.magicCode,
      userId: UserId = ObjectId(input.userId);
    const session = await this.getConfirmationSession(
      magicCode,
      userId,
      MAGIC_AUTH_STRATEGY
    );

    if (!session) throw new Error("invalid-magic-code");

    //delete the session after usage
    await this.securityService.logout(magicCode);

    return await this.multipleFactorService.login(userId, {
      authenticationStrategy: MAGIC_AUTH_STRATEGY,
      data: { sessionToken: input?.sessionToken },
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

    await this.createConfirmationSession(userId, {
      data: {
        token: magicCode,
        type: MAGIC_AUTH_STRATEGY,
        leftSubmissionsCount: this.config.leftSubmissionsCount,
      },
      expiresIn: this.config.magicCodeLifeDuration,
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
            paths.submitMagicCode +
              `?userId=${userId}&code=${magicCode}&sessionToken=${input.sessionToken}`
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
    userId: UserId,
    options: ICreateSessionOptions = {}
  ): Promise<string> {
    let session = await this.securityService.findSession(userId, {
      type: options.data.type,
    });
    let token;
    if (session && session.token) token = session.token;
    if (!token)
      token = await this.securityService.createSession(userId, options);

    return token;
  }

  async getConfirmationSession(
    token: string,
    userId: UserId,
    type: string
  ): Promise<ISession | null> {
    const session: ISession = await this.securityService.findSession(userId, {
      type,
    });

    if (!session) {
      return null;
    } else if (session.token !== token) {
      session.data = {
        ...session.data,
        leftSubmissionsCount: Math.max(
          session?.data?.leftSubmissionsCount - 1,
          0
        ),
      };
      await this.securityService.updateSession(session);
      return null;
    }
    if (session?.data?.leftSubmissionsCount === 0) {
      throw new SubmissionCountExceededException();
    }
    await this.securityService.validateSession(session);

    return session;
  }
}
