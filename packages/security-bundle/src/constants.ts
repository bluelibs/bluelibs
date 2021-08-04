import { Token } from "@bluelibs/core";
import {
  ISessionPersistance,
  IPermissionPersistance,
  IUserPersistance,
} from "./defs";
import { PermissionGraph } from "./services/PermissionGraph";

export const USER_PERSISTANCE_LAYER = new Token<IUserPersistance>();
export const SESSION_PERSISTANCE_LAYER = new Token<ISessionPersistance>();
export const PERMISSION_PERSISTANCE_LAYER = new Token<IPermissionPersistance>();
export const PERMISSION_GRAPH = new Token<PermissionGraph>();

export const PERMISSION_DEFAULT_DOMAIN = "app";
