import { UserBeforeCreateEvent } from "./../events";
import { Service, Inject, EventManager } from "@bluelibs/core";
import * as ms from "ms";
import {
  ISecurityService,
  IUser,
  ICreateSessionOptions,
  IFieldMap,
  FindAuthenticationStrategyResponse,
  ISession,
  UserId,
} from "../defs";
import {
  USER_PERSISTANCE_LAYER,
  SESSION_PERSISTANCE_LAYER,
} from "../constants";
import { IUserPersistance, ISessionPersistance } from "../defs";
import {
  UserAfterLogoutEvent,
  SessionRetrievedEvent,
  SessionBeforeCreateEvent,
} from "../events";
import {
  UserDisabledException,
  SessionExpiredException,
  UserNotFoundException,
  SubmissionCountExceeded,
} from "../exceptions";
import { UserDisabledEvent, UserEnabledEvent } from "../events";
import {
  SessionAfterCreateEvent,
  UserBeforeUpdateEvent,
  UserAfterUpdateEvent,
  UserBeforeLoginEvent,
  UserAfterLoginEvent,
  UserBeforeLogoutEvent,
  UserAfterCreateEvent,
  UserBeforeDeleteEvent,
  UserAfterDeleteEvent,
} from "../events";

@Service()
export class SecurityService implements ISecurityService {
  constructor(
    @Inject(USER_PERSISTANCE_LAYER)
    public readonly userPersistanceLayer: IUserPersistance,

    @Inject(SESSION_PERSISTANCE_LAYER)
    public readonly sessionPersistanceLayer: ISessionPersistance,

    protected readonly eventManager: EventManager
  ) {}

  /**
   * Creates the user and persists it to the database. Returns the newly created userId.
   *
   * @param data
   */
  async createUser(data: Partial<IUser> = {}): Promise<UserId> {
    const user = Object.assign(
      {},
      {
        isEnabled: true,
      },
      data
    );

    await this.eventManager.emit(
      new UserBeforeCreateEvent({
        user: data,
      })
    );

    const userId = await this.userPersistanceLayer.insertUser(user);

    await this.eventManager.emit(new UserAfterCreateEvent({ userId }));

    return userId;
  }

  async updateUser(userId, data) {
    await this.eventManager.emit(
      new UserBeforeUpdateEvent({
        userId,
        data,
      })
    );

    await this.userPersistanceLayer.updateUser(userId, data);

    await this.eventManager.emit(
      new UserAfterUpdateEvent({
        userId,
        data,
      })
    );
  }

  /**
   * Delete the user
   * @param userId
   */
  async deleteUser(userId: UserId): Promise<void> {
    await this.eventManager.emit(
      new UserBeforeDeleteEvent({
        userId,
      })
    );

    await this.userPersistanceLayer.deleteUser(userId);

    await this.eventManager.emit(
      new UserAfterDeleteEvent({
        userId,
      })
    );
  }

  /**
   * Returns the user with the filters and fields you specify
   *
   * @param filters
   * @param fields
   */
  async findUser(filters, fields?: any): Promise<Partial<IUser>> {
    return this.userPersistanceLayer.findUser(filters, fields);
  }

  /**
   * Returns the user with the userId and fields you specify
   *
   * @param filters
   * @param fields
   */
  async findUserById(userId, fields?: IFieldMap): Promise<Partial<IUser>> {
    return this.userPersistanceLayer.findUserById(userId, fields);
  }

  /**
   * Creating Authentication Token. This method persists to the database if new verihash needs to be generated
   *
   * @param userId
   * @param options
   */
  async createSession(userId, options: ICreateSessionOptions = {}) {
    if (!options.expiresIn) {
      options.expiresIn = "14d";
    }

    this.eventManager.emit(new SessionBeforeCreateEvent({ userId, options }));
    const expiresAt = new Date(Date.now() + ms(options.expiresIn));

    const token = await this.sessionPersistanceLayer.newSession(
      userId,
      expiresAt,
      options.data
    );

    this.eventManager.emit(
      new SessionAfterCreateEvent({ userId, token, options })
    );
    return token;
  }

  /**
   * This will return the token and login the user
   *
   * @param userId
   * @param options
   */
  async login(userId, options: ICreateSessionOptions): Promise<string> {
    if (!(await this.isUserEnabled(userId))) {
      throw new UserDisabledException();
    }

    await this.eventManager.emit(
      new UserBeforeLoginEvent({
        userId,
        authenticationStrategy: options.authenticationStrategy,
      })
    );

    const token = await this.createSession(userId, options);

    await this.updateUser(userId, {
      lastLoginAt: new Date(),
    });

    await this.eventManager.emit(
      new UserAfterLoginEvent({
        userId,
        authenticationStrategy: options.authenticationStrategy,
      })
    );

    return token;
  }

  /**
   * Logging out the user based on token
   * @param token
   */
  async logout(token: string) {
    const session = await this.sessionPersistanceLayer.getSession(token);

    if (!session) {
      return null;
    }

    const { userId } = session;

    await this.eventManager.emit(
      new UserBeforeLogoutEvent({
        userId,
      })
    );

    await this.sessionPersistanceLayer.deleteSession(token);

    await this.eventManager.emit(
      new UserAfterLogoutEvent({
        userId,
      })
    );
  }

  /**
   * @param token
   */
  async getSession(token: string): Promise<ISession | null> {
    const session = await this.sessionPersistanceLayer.getSession(token);

    if (!session) {
      return null;
    }

    await this.eventManager.emit(new SessionRetrievedEvent({ session }));

    await this.validateSession(session);

    return session;
  }

  /**
   * This function invalidates the previous token and retrieves a newly created one for it
   * @param token
   * @returns
   */
  async reissueSessionToken(token: string, expiresAt?: Date): Promise<string> {
    const session = await this.sessionPersistanceLayer.getSession(token);

    if (!session) {
      throw new Error("Invalid token provided for reissuing session");
    }

    this.sessionPersistanceLayer.deleteSession(token);

    return this.sessionPersistanceLayer.newSession(
      session.userId,
      expiresAt || session.expiresAt,
      session.data
    );
  }

  /**
   * Validates if the token is ok
   * @param session
   */
  protected async validateSession(session: ISession) {
    const { userId, expiresAt } = session;

    if (expiresAt.getTime() < new Date().getTime()) {
      throw new SessionExpiredException();
    }

    if (!this.isUserEnabled(userId)) {
      throw new UserDisabledException();
    }

    if (session?.data?.leftSubmissionsCount === 0) {
      throw new SubmissionCountExceeded();
    }
  }

  /**
   *
   * @param userId
   * @param authMethodName
   * @param data
   */
  async updateAuthenticationStrategyData<T = any>(
    userId: UserId,
    authMethodName: string,
    data: Partial<T>
  ): Promise<void> {
    return this.userPersistanceLayer.updateAuthenticationStrategyData(
      userId,
      authMethodName,
      data
    );
  }

  /**
   * Retrieves information stored for the authentication method.
   *
   * @param userId
   * @param methodName
   */
  async getAuthenticationStrategyData<T = any>(
    userId: UserId,
    methodName: string,
    fields?: IFieldMap
  ): Promise<Partial<T>> {
    return this.userPersistanceLayer.getAuthenticationStrategyData<T>(
      userId,
      methodName,
      fields
    );
  }

  async findThroughAuthenticationStrategy<T = any>(
    methodName: string,
    filters: any,
    fields?: IFieldMap
  ): Promise<null | FindAuthenticationStrategyResponse<T>> {
    return this.userPersistanceLayer.findThroughAuthenticationStrategy<T>(
      methodName,
      filters,
      fields
    );
  }

  /**
   * Retrieves information stored for the authentication method.
   *
   * @param userId
   * @param methodName
   */
  async removeAuthenticationStrategyData(
    userId: UserId,
    methodName: string
  ): Promise<any> {
    return this.userPersistanceLayer.removeAuthenticationStrategyData(
      userId,
      methodName
    );
  }

  /**
   * Disables the user, user can no longer login
   * @param userId
   */
  async disableUser(userId) {
    await this.sessionPersistanceLayer.deleteAllSessionsForUser(userId);

    await this.updateUser(userId, {
      isEnabled: false,
    });

    await this.eventManager.emit(
      new UserDisabledEvent({
        userId,
      })
    );
  }

  /**
   * Enables the user
   * @param userId
   */
  async enableUser(userId) {
    await this.updateUser(userId, {
      isEnabled: true,
    });

    await this.eventManager.emit(
      new UserEnabledEvent({
        userId,
      })
    );
  }

  /**
   * Check if the user is enabled and can login
   * @param userId
   */
  async isUserEnabled(userId): Promise<boolean> {
    const user = await this.findUserById(userId, {
      isEnabled: 1,
    });

    return Boolean(user?.isEnabled);
  }

  /**
   * Retrieves the roles stored under `user.roles`. Returns empty array for not-found users.
   *
   * @param userId
   * @returns
   */
  async getRoles(userId: UserId): Promise<string[]> {
    const user = await this.findUserById(userId, {
      roles: 1,
    });

    if (!user) {
      return [];
    }

    return user?.roles || [];
  }

  /**
   * Sets the roles. Careful as it can override previous roles.
   *
   * @param userId
   * @param roles
   * @returns
   */
  async setRoles(userId, roles: string[]) {
    return this.updateUser(userId, {
      roles,
    });
  }
  /**
   * Creating Authentication Token. This method persists to the database if new verihash needs to be generated
   *
   * @param userId
   * @param options
   */
  async createConfirmationSession(
    userId: UserId,
    options: ICreateSessionOptions = {}
  ) {
    let session: ISession =
      await this.sessionPersistanceLayer.getConfirmationSessionByUserId(
        userId,
        options.data.type
      );
    let token;
    if (session && session.token) token = session.token;
    if (!token) token = await this.createSession(userId, options);

    return token;
  }

  async getConfirmationSession(
    token: string,
    userId: UserId,
    type: string
  ): Promise<ISession | null> {
    const session =
      await this.sessionPersistanceLayer.getConfirmationSessionByUserId(
        userId,
        type
      );

    if (!session) {
      return null;
    } else if (session.token !== token) {
      await this.sessionPersistanceLayer.deleteSession(session.token);

      await this.sessionPersistanceLayer.newSession(
        session.userId,
        session.expiresAt,
        {
          token: session.token,
          type: session.data.type,
          leftSubmissionsCount: Math.max(
            session?.data?.leftSubmissionsCount - 1,
            0
          ),
        }
      );
      return null;
    }

    await this.eventManager.emit(new SessionRetrievedEvent({ session }));

    await this.validateSession(session);

    return session;
  }
  //maybe we do that in sessionPersistanceLayer, but I thought we dont update for a reason
  async updateSession(newSession: ISession): Promise<void> {
    await this.sessionPersistanceLayer.deleteSession(newSession.token);
    await this.sessionPersistanceLayer.newSession(
      newSession.userId,
      newSession.expiresAt,
      {
        token: newSession.token,
        ...newSession.data,
      }
    );
  }
}
