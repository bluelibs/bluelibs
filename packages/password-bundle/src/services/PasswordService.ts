import { UserLockedAfterFailedAttemptsEvent } from "./../events";
import { SecurityService, IFieldMap, UserId } from "@bluelibs/security-bundle";
import {
  IPasswordBundleConfig,
  IPasswordService,
  IPasswordAuthenticationStrategyCreationOptions,
  IPasswordValidationOptions,
  IPasswordAuthenticationStrategy,
  IHasherService,
} from "../defs";
import * as ms from "ms";
import { Inject, Service, EventManager } from "@bluelibs/core";
import { BUNDLE_CONFIG_TOKEN, HASHER_SERVICE_TOKEN } from "../constants";
import {
  PasswordInvalidEvent,
  PasswordResetRequestedEvent,
  PasswordResetWithTokenEvent,
} from "../events";
import {
  PasswordAuthenticationStrategyAttachedEvent,
  PasswordValidatedEvent,
} from "../events";
import {
  CooldownException,
  PasswordResetExpiredException,
  ResetPasswordInvalidTokenException,
  UsernameAlreadyExistsException,
} from "../exceptions";

@Service()
export class PasswordService implements IPasswordService {
  public readonly method: string = "password";

  constructor(
    protected readonly securityService: SecurityService,
    protected readonly eventManager: EventManager,

    @Inject(BUNDLE_CONFIG_TOKEN)
    protected readonly config: IPasswordBundleConfig,

    @Inject(HASHER_SERVICE_TOKEN)
    protected readonly hasherService: IHasherService
  ) {}

  /**
   * @returns The userId
   * @param username
   */
  async findUserIdByUsername(
    username: string,
    fields?: IFieldMap
  ): Promise<UserId> {
    const result =
      await this.securityService.findThroughAuthenticationStrategy<IPasswordAuthenticationStrategy>(
        this.method,
        {
          username,
        },
        fields
      );

    return result?.userId;
  }

  async attach(
    userId: UserId,
    options: IPasswordAuthenticationStrategyCreationOptions
  ): Promise<void> {
    const usernameExists = await this.usernameExists(options.username);
    if (usernameExists) {
      throw new UsernameAlreadyExistsException({ username: options.username });
    }

    const salt = this.hasherService.generateSalt();
    const passwordHash = this.hasherService.getHashedPassword(
      options.password,
      salt
    );

    const data: any = {
      salt,
      passwordHash,
      username: options.username,
      lastSuccessfulPasswordValidationAt: null,
      resetPasswordVerificationToken: null,
      resetPasswordRequestedAt: null,
      currentFailedLoginAttempts: 0,
      lastFailedLoginAttemptAt: null,
    };

    if (options.email) {
      data.email = options.email;
    }

    await this.updateData(userId, data);

    await this.eventManager.emit(
      new PasswordAuthenticationStrategyAttachedEvent({ userId })
    );
  }

  async isPasswordValid(
    userId: UserId,
    password: string,
    options: IPasswordValidationOptions = {
      failedAuthenticationAttemptsProcessing: true,
    }
  ): Promise<boolean> {
    const methodData = await this.getData(userId, {
      passwordHash: 1,
      salt: 1,
      currentFailedLoginAttempts: 1,
      lastFailedLoginAttemptAt: 1,
    });

    if (options.failedAuthenticationAttemptsProcessing) {
      // This will throw if it should be cooled down and method will no longer continue
      await this.checkIfInCooldown(
        userId,
        methodData.currentFailedLoginAttempts,
        methodData.lastFailedLoginAttemptAt
      );
    }

    const isValid =
      methodData.passwordHash ===
      this.hasherService.getHashedPassword(password, methodData.salt);

    if (isValid) {
      await this.eventManager.emit(new PasswordValidatedEvent({ userId }));
    } else {
      await this.eventManager.emit(new PasswordInvalidEvent({ userId }));
    }

    if (options.failedAuthenticationAttemptsProcessing) {
      // non-blocking
      this.processAuthenticationResult(isValid, userId, methodData);
    }

    return isValid;
  }

  /**
   * Authentication failed, so we are processing exactly that
   */
  protected async processAuthenticationResult(
    isValid: boolean,
    userId: UserId,
    methodData: Partial<IPasswordAuthenticationStrategy>
  ) {
    if (isValid) {
      await this.updateData(userId, {
        currentFailedLoginAttempts: 0,
        lastFailedLoginAttemptAt: null,
      });
    } else {
      const failedAttempts = methodData.currentFailedLoginAttempts + 1;
      // Increment failed login attempts
      await this.updateData(userId, {
        currentFailedLoginAttempts: failedAttempts,
        lastFailedLoginAttemptAt: new Date(),
      });

      if (
        failedAttempts >= this.config.failedAuthenticationAttempts.lockAfter
      ) {
        await this.eventManager.emit(
          new UserLockedAfterFailedAttemptsEvent({
            userId,
            failedAttempts,
          })
        );
      }
    }
  }

  /**
   * This simply checks if cooldown period of failed login attempts has passed and there are enough login attempts
   * Throws an error if not ok, resets currentFailedLoginAttempts
   */
  protected async checkIfInCooldown(
    userId: UserId,
    currentFailedLoginAttempts: number,
    lastFailedLoginAttemptAt: Date
  ): Promise<void> {
    const { cooldown, lockAfter } = this.config.failedAuthenticationAttempts;
    if (currentFailedLoginAttempts >= lockAfter) {
      // We need to check if in the meanwhile we've cooled down
      if (lastFailedLoginAttemptAt) {
        if (lastFailedLoginAttemptAt.getTime() + ms(cooldown) < Date.now()) {
          // it's ok, cooldown passed
          await this.updateData(userId, {
            currentFailedLoginAttempts: 0,
          });
        } else {
          throw new CooldownException({
            context: "login",
          });
        }
      }
    }
  }

  async createTokenForPasswordReset(userId: UserId): Promise<string> {
    // We need to check if there have been any requests in the past X time
    const isEligible = await this.isEligibleForPasswordResetRequest(userId);

    if (!isEligible) {
      throw new CooldownException({
        context: "reset-password",
      });
    }

    const token = this.hasherService.generateToken();

    await this.updateData(userId, {
      resetPasswordVerificationToken: token,
      resetPasswordRequestedAt: new Date(),
    });

    await this.eventManager.emit(
      new PasswordResetRequestedEvent({
        userId,
        token,
      })
    );

    return token;
  }

  async isResetPasswordTokenValid(
    userId: UserId,
    token: string
  ): Promise<boolean> {
    const result = await this.getData(userId, {
      resetPasswordVerificationToken: 1,
      resetPasswordRequestedAt: 1,
    });

    if (
      result.resetPasswordRequestedAt.getTime() +
        ms(this.config.resetPassword.expiresAfter) <
      Date.now()
    ) {
      throw new PasswordResetExpiredException();
    }

    if (result?.resetPasswordVerificationToken) {
      return result.resetPasswordVerificationToken === token;
    }

    return false;
  }

  async resetPassword(
    userId: UserId,
    token: string,
    newPassword: string
  ): Promise<void> {
    if (await this.isResetPasswordTokenValid(userId, token)) {
      await this.setPassword(userId, newPassword);
      await this.updateData(userId, {
        resetPasswordVerificationToken: null,
        resetPasswordRequestedAt: null,
      });
      await this.eventManager.emit(
        new PasswordResetWithTokenEvent({
          userId,
          token,
        })
      );
    } else {
      throw new ResetPasswordInvalidTokenException();
    }
  }

  /**
   * Sets the password for the user based on its salt
   * @param userId
   * @param password
   */
  async setPassword(userId: UserId, password: string): Promise<void> {
    const user = await this.getData(userId, {
      salt: 1,
    });
    const passwordHash = this.hasherService.getHashedPassword(
      password,
      user.salt
    );

    this.updateData(userId, {
      passwordHash,
    });
  }

  /**
   * Sets the username for the user
   * @param userId
   * @param username
   */
  async setUsername(userId: UserId, username: string): Promise<void> {
    await this.updateData(userId, {
      username,
    });
  }

  /**
   * Helper method to get data easier
   * @param userId
   * @param fields
   */
  async getData(
    userId,
    fields?: IFieldMap
  ): Promise<Partial<IPasswordAuthenticationStrategy>> {
    return this.securityService.getAuthenticationStrategyData<IPasswordAuthenticationStrategy>(
      userId,
      this.method,
      fields
    );
  }

  /**
   * Checks if there is already an username attached with this information
   *
   * @param username
   * @param exceptUserId You can also except certain users, like for example when you are updating certain user data
   * @returns
   */
  async usernameExists(
    username: string,
    exceptUserId?: UserId
  ): Promise<boolean> {
    if (exceptUserId) {
      const result =
        await this.securityService.findThroughAuthenticationStrategy(
          this.method,
          {
            username,
          }
        );

      if (!result) {
        return false;
      }
      if (result.userId.toString() === exceptUserId.toString()) {
        return false;
      } else {
        return true;
      }
    } else {
      const result =
        await this.securityService.findThroughAuthenticationStrategy(
          this.method,
          {
            username,
          }
        );

      return Boolean(result);
    }
  }

  /**
   * Helper method to easily update the password data
   * @param userId
   * @param data
   */
  async updateData(
    userId,
    data: Partial<IPasswordAuthenticationStrategy>
  ): Promise<void> {
    if (data.username) {
      const alreadyExists = await this.usernameExists(data.username, userId);
      if (alreadyExists) {
        throw new UsernameAlreadyExistsException({ username: data.username });
      }
    }

    await this.securityService.updateAuthenticationStrategyData<IPasswordAuthenticationStrategy>(
      userId,
      this.method,
      data
    );
  }

  /**
   * Check if he hasn't requested the password too often
   * @param userId
   */
  protected async isEligibleForPasswordResetRequest(
    userId: UserId
  ): Promise<boolean> {
    const methodData = await this.getData(userId, {
      resetPasswordRequestedAt: 1,
    });

    // Has been cleared or never requested.
    if (!methodData.resetPasswordRequestedAt) {
      return true;
    }

    return (
      Date.now() - ms(this.config.resetPassword.cooldown) >
      methodData.resetPasswordRequestedAt.getTime()
    );
  }
}
