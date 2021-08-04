import { PermissionGraph } from "../../services/PermissionGraph";
import { IPermissionTree } from "../../defs";
import { assert } from "chai";
import { Permissions, PermissionTree } from "./mocks/permissionTree.mock";

describe("PermissionGraph", () => {
  it("Should instantiate", () => {
    const permission = new PermissionGraph(PermissionTree);

    const result1 = permission.getParentRolesOf(Permissions.INVOICE_MANAGEMENT);
    expect(result1).toHaveLength(1);
    expect(result1[0]).toBe(Permissions.ADMIN);

    const result2 = permission.getParentRolesOf(Permissions.INVOICE_READ);
    expect(result2).toHaveLength(2);
    expect(result2).toContain(Permissions.ADMIN);
    expect(result2).toContain(Permissions.INVOICE_MANAGEMENT);

    const result3 = permission.getSubRolesOf(Permissions.ADMIN);
    expect(result3).toHaveLength(4);
    expect(result3).toContain(Permissions.INVOICE_READ);
    expect(result3).toContain(Permissions.INVOICE_CREATE);
    expect(result3).toContain(Permissions.INVOICE_MARK_AS_PAID);
    expect(result3).toContain(Permissions.INVOICE_MANAGEMENT);
  });
});
