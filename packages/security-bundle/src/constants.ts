import { Token } from "@bluelibs/core";
import {
  ISessionPersistance,
  IPermissionPersistance,
  IUserPersistance,
} from "./defs";
import { PermissionGraph } from "./services/PermissionGraph";

export const USER_PERSISTANCE_LAYER = new Token<IUserPersistance>(
  "SECURITY_BUNDLE::USER_PERSISTANCE_LAYER"
);
export const SESSION_PERSISTANCE_LAYER = new Token<ISessionPersistance>(
  "SECURITY_BUNDLE::SESSION_PERSISTANCE_LAYER"
);
export const PERMISSION_PERSISTANCE_LAYER = new Token<IPermissionPersistance>(
  "SECURITY_BUNDLE::PERMISSION_PERSISTANCE_LAYER"
);
export const PERMISSION_GRAPH = new Token<PermissionGraph>(
  "SECURITY_BUNDLE::PERMISSION_GRAPH"
);

export const PERMISSION_DEFAULT_DOMAIN = "app";
