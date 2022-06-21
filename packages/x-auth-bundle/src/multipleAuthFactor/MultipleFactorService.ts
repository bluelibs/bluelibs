import { MULTIPLE_FACTOR_STRATEGY, X_AUTH_SETTINGS } from "../constants";
import { IXAuthBundleConfig } from "../defs";
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
import { MultipleFactorRedirect } from "./defs";

@Service()
export class MultipleFactorService {
  constructor(
    protected readonly container: ContainerInstance,
    @Inject(X_AUTH_SETTINGS)
    protected readonly config: IXAuthBundleConfig,
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
      lastLoginAt: 1,
    });

    if (
      new Date().getTime() >
      new Date(user.lastLoginAt).getTime() + 7 * 24 * 60 * 60 * 1000 //week
    )
      return true;
    else return false;
  }

  async login(
    userId: UserId,
    options: ICreateSessionOptions
  ): Promise<{ token: string } | MultipleFactorRedirect> {
    if (
      !this.isMultipleFactorRequired() ||
      (this.isMultipleFactorRequired() &&
        !(await this.userHaveToMultipleFactorAuth(userId)))
    ) {
      return { token: await this.securityService.login(userId, options) };
    }

    const session = await this.loginSessionFactor(
      userId,
      options.authenticationStrategy
    );
    //if all is authenticated return token to login
    if (
      Object.keys(session.data.factors).every(
        (k) => session.data.factors[k] === true
      )
    ) {
      await this.securityService.deleteSession(session.token);
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
        //we can name this redirect url token
        redirectUrl:
          this.config.multipleFactorAuth.factors.find(
            (f) => f.strategy === nextUnauthrozedStrategy
          )?.redirectUrl + `?userId=${userId}`,
        strategy: nextUnauthrozedStrategy,
      };
    }
  }

  async loginSessionFactor(
    userId: UserId,
    factorStratergy: string
  ): Promise<ISession> {
    let session = await this.securityService.findSession(userId, {
      type: MULTIPLE_FACTOR_STRATEGY,
    });
    if (!session) {
      const token = await this.securityService.createSession(userId, {
        expiresIn: "5m",
        data: {
          type: MULTIPLE_FACTOR_STRATEGY,
          factors: this.config.multipleFactorAuth.factors.reduce(
            (acc, curr) => ((acc[curr.strategy] = false), acc),
            {}
          ),
        },
      });
      session = await this.securityService.getSession(token);
    }
    if (!session) throw new SessionNotFound();
    if (session.userId + "" !== userId + "") throw new UserSessionError();
    if (
      !session?.data?.factors ||
      !Object.keys(session?.data?.factors).find((k) => k === factorStratergy)
    )
      throw new UnValidFactorStrategy();
    session.data.factors[factorStratergy] = true;
    session.token = await this.securityService.updateSession(session);

    return session;
  }
}
