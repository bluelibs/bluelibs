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
export type UserId = number | string | ObjectId;

export interface IUser {
  _id?: UserId;
  isEnabled: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
  roles?: string[];
  socialAccounts?: { service: string; id: string }[];
}

export interface IFieldMap {
  [key: string]: number;
}
export interface IPermissioning {
  addPermission(userPermission: IPermission): any;

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

export interface IUserPersistance {
  insertUser(data): Promise<any>; // returns UserID
  updateUser(userId, data): Promise<void>; // $set, returns void
  deleteUser(userId): Promise<void>;

  findUser(filters, fields?: IFieldMap): Promise<IUser>;
  findUserById(userId: UserId, fields?: IFieldMap): Promise<IUser>;

  findThroughAuthenticationStrategy<T = any>(
    strategyName: string,
    filters,
    fields?: IFieldMap
  ): Promise<null | FindAuthenticationStrategyResponse<T>>;
  removeAuthenticationStrategyData(
    userId,
    authenticationStrategyName: string
  ): Promise<void>;
  updateAuthenticationStrategyData<T = any>(
    userId: UserId,
    authenticationStrategyName: string,
    data: Partial<T>
  ): Promise<void>;
  getAuthenticationStrategyData<T = any>(
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

export interface ISessionData {
  leftSubmissionsCount?: number;
  type?: string;
}

export interface ISessionPersistance {
  /**
   * Returns the token newly generated
   * @param sessionData
   */
  newSession(userId, expiresAt: Date, data?: any): Promise<string>;
  getSession(token: string): Promise<ISession>;
  deleteSession(token: string): Promise<void>;
  deleteAllSessionsForUser(userId: UserId): Promise<void>;
  getConfirmationSessionByUserId(
    userId: UserId,
    type: string
  ): Promise<ISession>;
  /**
   * Cleanup old, no longer available, expired tokens
   */
  cleanExpiredTokens(): Promise<void>;
}

export interface IPermissionPersistance {
  insertPermission(permission: IPermission): Promise<any>;
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
  userId?: any[];
  permission?: string[];
  domain?: string[];
  domainIdentifier?: string[] | ObjectId[];
  createdById?: any[];
}

export interface IPermissionSearch {
  userId?: any;
  permission?: string;
  domain?: string;
  domainIdentifier?: string | ObjectId;
  createdById?: any;
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
  createUser(data): Promise<any>;
  updateUser(userId, data: object): Promise<void>;
  deleteUser(userId): Promise<void>;

  findUser(filters, fields?: IFieldMap): Promise<Partial<IUser>>;
  findUserById(userId: UserId, fields?: IFieldMap): Promise<Partial<IUser>>;

  login(userId, options: ICreateSessionOptions): Promise<string>;
  logout(userId: UserId): Promise<void>;

  createSession(userId, options?: ICreateSessionOptions): Promise<string>;
  getSession(token): Promise<ISession>;

  updateAuthenticationStrategyData<T = any>(
    userId: UserId,
    strategyName: string,
    data: Partial<T>
  ): Promise<void>;
  findThroughAuthenticationStrategy<T = any>(
    strategyName: string,
    filters,
    fields?: IFieldMap
  ): Promise<null | FindAuthenticationStrategyResponse<T>>;
  getAuthenticationStrategyData<T = any>(
    userId: UserId,
    strategyName: string,
    fields?: IFieldMap
  ): Promise<Partial<T>>;
  removeAuthenticationStrategyData(
    userId: UserId,
    strategyName: string
  ): Promise<any>;
  isUserEnabled(userId: UserId): Promise<boolean>;
  enableUser(userId: UserId): Promise<void>;
  disableUser(userId: UserId): Promise<void>;
}

export interface FindAuthenticationStrategyResponse<T = any> {
  userId: UserId;
  strategy: T;
}

export interface ICreateSessionOptions {
  authenticationStrategy?: string;
  /**
   * This is for storing additional data inside the token that we may need later
   */
  data?: any;
  /**
   * npm package zeit/ms format
   */
  expiresIn?: string;
}
