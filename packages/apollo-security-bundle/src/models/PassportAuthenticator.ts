import { Service } from "@bluelibs/core";
import { IUser, SecurityService } from "@bluelibs/security-bundle";
import * as passport from "passport";
import * as express from "express";
import { ApolloBundle } from "@bluelibs/apollo-bundle";

export type FindOrCreateResponse = {
  isNew: boolean;
  user: Partial<IUser>;
};

export type EasyRouteCallback<T = IUser> = (
  err,
  user,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => void | Promise<void>;

@Service()
export abstract class PassportAuthenticator {
  public strategy: passport.Strategy;
  protected app: express.Application;

  constructor(
    protected readonly securityService: SecurityService,
    protected readonly apolloBundle: ApolloBundle
  ) {
    this.app = apolloBundle.app;
    this.strategy = this.createStrategy();
  }

  /**
   * Returns the authentication strategy
   */
  abstract createStrategy(): passport.Strategy;

  get name(): string {
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
      passport.authenticate(this.name, options, (err, user) => {
        callback(err, user, req, res, next);
      })(req, res, next);
    });
  }

  /**
   * Helper function to easily create the user
   * @param profile
   * @param authenticationField This is used to store the id at the user level to identify the authentication scheme
   * @returns
   */
  protected async findOrCreate(
    profileId,
    authenticationField: string = null
  ): Promise<FindOrCreateResponse> {
    if (authenticationField === null) {
      authenticationField = `${this.name}Id`;
    }

    const user = await this.securityService.findUser({
      [authenticationField]: profileId,
    });

    if (user) {
      return {
        isNew: false,
        user,
      };
    }

    if (!user) {
      const userId = await this.securityService.createUser();

      // We store the profile id so we can later find the user by it
      await this.securityService.updateUser(userId, {
        [authenticationField]: profileId,
      });

      const user = await this.securityService.findUserById(userId);

      return {
        isNew: true,
        user,
      };
    }
  }

  /**
   * Returns a login token for the user
   * @param userId
   * @returns
   */
  protected async getToken(userId): Promise<string> {
    return this.securityService.login(userId, {
      authenticationStrategy: this.name,
    });
  }
}
