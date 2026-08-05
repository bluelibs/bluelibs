import { Constructor } from "@bluelibs/core";
import { ObjectId } from "@bluelibs/ejson";

export interface ISecurityBundleConfig {
  userPersistance?: Constructor<IUserPersistance>;
  sessionPersistance?: Constructor<ISessionPersistance>;
  permissionPersistance?: Constructor<IPermissionPersistance>;
  permissionTree?: IPermissionTree;
  session?: {
    expiresIn?: string;
    cleanup?: boolean;
    cleanupInterval?: string;
  };
}
export type UserId = number | string | ObjectId | Partial<ObjectId>;

/**
 * User records may carry strategy-specific fields beyond the known IUser shape
 * (password/profile data, arbitrary attributes), so we allow extra keys.
 */
export type IUserData = Partial<IUser> & Record<string, unknown>;

export interface IUser {
  _id?: UserId;
  isEnabled: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
  roles?: string[];
}

export interface IFieldMap {
  [key: string]: number;
}
export interface IPermissioning {
  addPermission(userPermission: IPermission): Promise<void>;

  hasPermission(
    userId: UserId,
    permission: string,
    domain?: string,
    domainIdentifier?: string
  ): boolean;

  findPermission(
    permission?: string,
    userId?: UserId,
    domain?: string,
    domainIdentifier?: string
  ): IPermission;

  findPermissions(
    userId?: UserId,
    permission?: string,
    domain?: string,
    domainIdentifier?: string
  ): IPermission[];

  removePermission(
    userId: UserId,
    permission: string,
    domain?: string,
    domainIdentifier?: string
  ): void;

  removePermissions(
    userId: UserId,
    permission?: string,
    domain?: string,
    domainIdentifier?: string
  ): void;
}

export interface IUserPersistance<K extends IUser = IUser> {
  insertUser(data: IUserData): Promise<UserId>; // returns UserID
  updateUser(userId: UserId, data: IUserData): Promise<void>; // $set, returns void
  deleteUser(userId: UserId): Promise<void>;

  findUser(filters: Record<string, unknown>, fields?: IFieldMap): Promise<K>;
  findUserById(userId: UserId, fields?: IFieldMap): Promise<K>;

  findThroughAuthenticationStrategy<T = unknown>(
    strategyName: string,
    filters: Record<string, unknown>,
    fields?: IFieldMap
  ): Promise<null | FindAuthenticationStrategyResponse<T>>;
  removeAuthenticationStrategyData(
    userId: UserId,
    authenticationStrategyName: string
  ): Promise<void>;
  updateAuthenticationStrategyData<T = unknown>(
    userId: UserId,
    authenticationStrategyName: string,
    data: Partial<T>
  ): Promise<void>;
  getAuthenticationStrategyData<T = unknown>(
    userId: UserId,
    authenticationStrategyName: string,
    fields?: IFieldMap
  ): Promise<Partial<T>>;
}

export interface ISession {
  token: string;
  userId: UserId;
  expiresAt: Date;
  data?: ISessionData;
}

export interface ISessionData {}

export interface ISessionPersistance {
  /**
   * Returns the token newly generated
   * @param sessionData
   */
  newSession(
    userId: UserId,
    expiresAt: Date,
    data?: ISessionData
  ): Promise<string>;
  getSession(token: string): Promise<ISession>;
  deleteSession(token: string): Promise<void>;
  deleteAllSessionsForUser(userId: UserId): Promise<void>;
  findSession(userId: UserId, data: Partial<ISessionData>): Promise<ISession>;
  /**
   * Cleanup old, no longer available, expired tokens
   */
  cleanExpiredTokens(): Promise<void>;
}

export interface IPermissionPersistance {
  insertPermission(permission: IPermission): Promise<void>;
  removePermission(filters: IPermissionSearchFilters): Promise<void>;
  countPermissions(filters: IPermissionSearchFilters): Promise<number>;
  findPermissions(search: IPermissionSearchFilters): Promise<IPermission[]>;
  findPermission(search: IPermissionSearchFilters): Promise<IPermission>;
  findDomains(userId: UserId): Promise<string[]>;
}

export interface IPermissionSearchFilter {
  userId?: UserId | UserId[];
  permission?: string | string[];
  domain?: string | string[];
  domainIdentifier?: string | string[] | ObjectId | ObjectId[];
  createdById?: UserId | UserId[];
}

export interface IPermissionSearchFilters {
  userId?: UserId[];
  permission?: string[];
  domain?: string[];
  domainIdentifier?: string[] | ObjectId[];
  createdById?: UserId[];
}

export interface IPermissionSearch {
  userId?: UserId;
  permission?: string;
  domain?: string;
  domainIdentifier?: string | ObjectId;
  createdById?: UserId;
}

export interface IPermission {
  userId: UserId;
  permission: string;
  domain: string;
  domainIdentifier?: string | ObjectId;
  createdById?: UserId;
}

export interface IPermissionTree {
  [key: string]: number | IPermissionTree;
}

export interface IPermissionService {
  add(permission: IPermission): Promise<void>;
  remove(permission: IPermission): Promise<void>;
  has(permission: IPermission): Promise<boolean>;
  findPermissions(search: IPermissionSearchFilter): Promise<IPermission[]>;
  findPermission(search: IPermissionSearchFilter): Promise<IPermission>;
  findDomains(userId: UserId): Promise<string[]>;
}

export interface ISecurityService {
  /**
   * Returns userId
   */
  createUser(data?: IUserData): Promise<UserId>;
  updateUser(userId: UserId, data: IUserData): Promise<void>;
  deleteUser(userId: UserId): Promise<void>;

  findUser(
    filters: Record<string, unknown>,
    fields?: IFieldMap
  ): Promise<Partial<IUser>>;
  findUserById(userId: UserId, fields?: IFieldMap): Promise<Partial<IUser>>;

  login(userId: UserId, options: ICreateSessionOptions): Promise<string>;
  logout(userId: UserId): Promise<void>;

  createSession(
    userId: UserId,
    options?: ICreateSessionOptions
  ): Promise<string>;
  getSession(token: string): Promise<ISession>;

  updateAuthenticationStrategyData<T = unknown>(
    userId: UserId,
    strategyName: string,
    data: Partial<T>
  ): Promise<void>;
  findThroughAuthenticationStrategy<T = unknown>(
    strategyName: string,
    filters: Record<string, unknown>,
    fields?: IFieldMap
  ): Promise<null | FindAuthenticationStrategyResponse<T>>;
  getAuthenticationStrategyData<T = unknown>(
    userId: UserId,
    strategyName: string,
    fields?: IFieldMap
  ): Promise<Partial<T>>;
  removeAuthenticationStrategyData(
    userId: UserId,
    strategyName: string
  ): Promise<void>;
  isUserEnabled(userId: UserId): Promise<boolean>;
  enableUser(userId: UserId): Promise<void>;
  disableUser(userId: UserId): Promise<void>;
}

export interface FindAuthenticationStrategyResponse<T = unknown> {
  userId: UserId;
  strategy: T;
}

export interface ICreateSessionOptions {
  authenticationStrategy?: string;
  /**
   * This is for storing additional data inside the token that we may need later
   */
  data?: ISessionData;
  /**
   * npm package zeit/ms format
   */
  expiresIn?: string;
}
