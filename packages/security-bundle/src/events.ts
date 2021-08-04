import { Event } from "@bluelibs/core";
import {
  IUser,
  IPermission,
  ISession,
  ICreateSessionOptions,
  IPermissionSearchFilter,
  UserId,
} from "./defs";

export class UserBeforeCreateEvent extends Event<{ user: Partial<IUser> }> {}
export class UserAfterCreateEvent extends Event<{ userId: UserId }> {}

export class UserBeforeUpdateEvent extends Event<{
  userId: UserId;
  data: object;
}> {}
export class UserAfterUpdateEvent extends Event<{
  userId: UserId;
  data: object;
}> {}

export class UserBeforeDeleteEvent extends Event<{
  userId: UserId;
}> {}
export class UserAfterDeleteEvent extends Event<{
  userId: UserId;
}> {}

export class UserBeforeLoginEvent extends Event<{
  userId: UserId;
  authenticationStrategy?: string;
}> {}
export class UserAfterLoginEvent extends Event<{
  userId: UserId;
  authenticationStrategy?: string;
}> {}

export class UserBeforeLogoutEvent extends Event<{
  userId: UserId;
  authenticationStrategy?: string;
}> {}
export class UserAfterLogoutEvent extends Event<{
  userId: UserId;
  authenticationStrategy?: string;
}> {}

export class UserDisabledEvent extends Event<{
  userId: UserId;
}> {}

export class UserEnabledEvent extends Event<{
  userId: UserId;
}> {}

export class UserBeforeAddPermissionEvent extends Event<{
  permission: IPermission;
}> {}
export class UserAfterAddPermissionEvent extends Event<{
  permission: IPermission;
}> {}

export class UserBeforeRemovePermissionEvent extends Event<{
  filters: IPermissionSearchFilter;
}> {}
export class UserAfterRemovePermissionEvent extends Event<{
  filters: IPermissionSearchFilter;
}> {}

export class SessionRetrievedEvent extends Event<{
  session: ISession;
}> {}

export class SessionBeforeCreateEvent extends Event<{
  userId: UserId;
  options: ICreateSessionOptions;
}> {}

export class SessionAfterCreateEvent extends Event<{
  userId: UserId;
  token: any;
  options: ICreateSessionOptions;
}> {}
