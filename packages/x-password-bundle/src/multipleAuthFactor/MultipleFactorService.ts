import { MULTIPLE_FACTOR_STRATEGY, X_PASSWORD_SETTINGS } from "../constants";
import { IXPasswordBundleConfig } from "../defs";
import { Inject, Service, ContainerInstance } from "@bluelibs/core";
import { PasswordService } from "@bluelibs/password-bundle";
import {
  SecurityService,
  UserId,
  ISession,
  ICreateSessionOptions,
  SessionExpiredException,
} from "@bluelibs/security-bundle";
import {
  SessionNotFound,
  UnValidFactorStrategy,
  UserSessionError,
} from "./exceptions";
import { MultipleFcatorRedirect } from "./defs";

@Service()
export class MultipleFactorService {
  constructor(
    protected readonly container: ContainerInstance,
    @Inject(X_PASSWORD_SETTINGS)
    protected readonly config: IXPasswordBundleConfig,
    protected readonly securityService: SecurityService,
    protected readonly passwordService: PasswordService
  ) {
    if (this.config?.multipleFactorAuth?.userHaveToMultipleFactorAuth) {
      this.userHaveToMultipleFactorAuth =
        this.config?.multipleFactorAuth?.userHaveToMultipleFactorAuth;
    } else {
      this.userHaveToMultipleFactorAuth =
        this.defaultUserHaveToMultipleFactorAuth;
    }
  }

  userHaveToMultipleFactorAuth: (userId: UserId) => Promise<boolean>;

  isMultipleFactorRequired(): boolean {
    if (this.config.multipleFactorAuth) return true;
    return false;
  }

  async defaultUserHaveToMultipleFactorAuth(userId: UserId): Promise<boolean> {
    const user = await this.securityService.findUserById(userId, {
      profile: 1,
    });
    return true;
    if (
      new Date(user.lasrLoginAt).getTime() -
        new Date(user.lastLoginAt).getTime() >
      24 * 60 * 60 * 1000
    )
      return true;
    else return false;
  }

  async login(
    userId: UserId,
    options: ICreateSessionOptions
  ): Promise<{ token: string } | MultipleFcatorRedirect> {
    if (
      !this.isMultipleFactorRequired() ||
      (this.isMultipleFactorRequired() &&
        !this.userHaveToMultipleFactorAuth(userId))
    ) {
      return { token: await this.securityService.login(userId, options) };
    }

    let sessionToken = options?.data?.sessionToken;
    if (!sessionToken) {
      sessionToken = await this.securityService.createSession(userId, {
        expiresIn: "5m",
        data: {
          factors: this.config.multipleFactorAuth.factors.reduce(
            (acc, curr) => ((acc[curr.strategy] = false), acc),
            {}
          ),
        },
      });
    }
    const session = await this.loginSessionFactor(
      userId,
      sessionToken,
      options.authenticationStrategy
    );
    //if all is authenticated return token to login
    if (
      Object.keys(session.data.factors).every(
        (k) => session.data.factors[k] === true
      )
    ) {
      return {
        token: await this.securityService.login(
          userId /*add multiple factor strategy*/,
          { authenticationStrategy: MULTIPLE_FACTOR_STRATEGY }
        ),
      };
    }
    //if not return the next not authenticated strategy andi ts path
    else {
      const nextUnauthrozedStrategy = Object.keys(session.data.factors).find(
        (k) => session.data.factors[k] === false
      );

      return {
        sessionToken: sessionToken,
        //we can name this redirect url token
        redirectUrl:
          this.config.multipleFactorAuth.factors.find(
            (f) => f.strategy === nextUnauthrozedStrategy
          )?.redirectUrl + `?userId=${userId}&sessionToken=${sessionToken}`,
        strategy: nextUnauthrozedStrategy,
      };
      /*return {
        token:
          this.config.multipleFactorAuth.factors.find(
            (f) => f.strategy === nextUnauthrozedStrategy
          )?.redirectUrl + `?userId=${userId}&sessionToken=${sessionToken}`,
      };*/
    }
  }

  async loginSessionFactor(
    userId: UserId,
    sessionToken: string,
    factorStratergy: string
  ): Promise<ISession> {
    const session = await this.securityService.getSession(sessionToken);
    if (!session) throw new SessionNotFound();
    if (session.userId + "" !== userId + "") throw new UserSessionError();
    if (
      !session?.data?.factors ||
      !Object.keys(session?.data?.factors).find((k) => k === factorStratergy)
    )
      throw new UnValidFactorStrategy();
    session.data.factors[factorStratergy] = true;
    await this.securityService.updateSession(session);

    return session;
  }
}
