import { Service } from "@bluelibs/core";
import { IUser, SecurityService, UserId } from "@bluelibs/security-bundle";
import passport from "passport";
import * as express from "express";
import { ApolloBundle } from "@bluelibs/apollo-bundle";

export type FindOrCreateResponse = {
  isNew: boolean;
  user: Partial<IUser>;
};

export type EasyRouteCallback = (
  err: unknown,
  user: Partial<IUser> | undefined,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => void | Promise<void>;

// @ts-expect-error - abstract class with decorator for DI
@Service()
export abstract class PassportAuthenticator {
  public strategy: passport.Strategy;

  constructor(
    protected readonly securityService: SecurityService,
    protected readonly apolloBundle: ApolloBundle
  ) {
    this.strategy = this.createStrategy();
  }

  get app(): express.Application {
    return this.apolloBundle.app;
  }

  /**
   * Returns the authentication strategy
   */
  abstract createStrategy(): passport.Strategy;

  get name(): string {
    if (!this.strategy?.name) {
      throw new Error("Strategy name is not available");
    }
    return this.strategy.name;
  }

  /**
   *
   * @returns the path for this
   */
  abstract route(): void;

  /**
   * This is a helper method to easily create routes and gives you access to error, user and express context
   * @param path
   * @param options
   * @param callback
   */
  protected get(path: string, options: object, callback: EasyRouteCallback) {
    this.app.get(path, (req, res, next) => {
      passport.authenticate(
        this.name,
        options,
        (err: unknown, user: Partial<IUser> | undefined) => {
          callback(err, user, req, res, next!);
        }
      )(req, res, next!);
    });
  }

  /**
   * Helper function to easily create the user
   * @param profile
   * @param authenticationField This is used to store the id at the user level to identify the authentication scheme
   * @returns
   */
  protected async findOrCreate(
    profileId: string | number,
    authenticationField?: string
  ): Promise<FindOrCreateResponse | undefined> {
    const name = this.name;
    const authField = authenticationField ?? `${name}Id`;

    const user = await this.securityService.findUser({
      [authField]: profileId,
    });

    if (user) {
      return {
        isNew: false,
        user,
      };
    }

    const userId = await this.securityService.createUser();

    // We store the profile id so we can later find the user by it
    await this.securityService.updateUser(userId, {
      [authField]: profileId,
    });

    const newUser = await this.securityService.findUserById(userId);
    if (!newUser) {
      return undefined;
    }

    return {
      isNew: true,
      user: newUser,
    };
  }

  /**
   * Returns a login token for the user
   * @param userId
   * @returns
   */
  protected async getToken(userId: UserId): Promise<string> {
    return this.securityService.login(userId, {
      authenticationStrategy: this.name,
    });
  }
}
