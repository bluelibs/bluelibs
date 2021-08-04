import { IPermissionTree } from "../../../defs";

export const Permissions: any = {
  USER: "USER", // User is applied to all logged in users. Regardless. It's a special permission that all users have.
  ADMIN: "ADMIN",
  INVOICE_MANAGEMENT: "INVOICE_MANAGEMENT",
  INVOICE_READ: "INVOICE_READ",
  INVOICE_CREATE: "INVOICE_CREATE",
  INVOICE_MARK_AS_PAID: "INVOICE_MARK_AS_PAID",
};

const $ = Permissions;

export const PermissionTree: IPermissionTree = {
  [$.ADMIN]: {
    [$.INVOICE_MANAGEMENT]: 1,
  },

  [$.INVOICE_MANAGEMENT]: {
    [$.INVOICE_READ]: 1,
    [$.INVOICE_CREATE]: 1,
    [$.INVOICE_MARK_AS_PAID]: 1,
  },

  [$.USER]: 1,
};
