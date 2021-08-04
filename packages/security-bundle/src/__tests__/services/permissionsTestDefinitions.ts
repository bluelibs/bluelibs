import { Permissions, PermissionTree } from "./mocks/permissionTree.mock";
import { PermissionService, PermissionGraph, IPermissionService } from "../..";
import { PermissionsPersistanceService } from "./mocks/PermissionsPersistanceService.mock";
import { EventManager } from "@bluelibs/core";
import { SecurityService } from "../../services/SecurityService";

const permission = new PermissionGraph(PermissionTree);
const PERMISSION_DEFAULT_DOMAIN = "app";

export function permissionServiceCreator(): PermissionService {
  const permissionPersistanceLayer = new PermissionsPersistanceService();
  const eventManager = new EventManager();

  return new PermissionService(
    permissionPersistanceLayer,
    permission,
    eventManager,
    ({
      getRoles() {
        return [Permissions.USER];
      },
    } as unknown) as SecurityService
  );
}

export const permissionServiceTestDefinitions = [
  {
    message: "Should work with no domains",
    async test(service: PermissionService) {
      await service.add({
        userId: "U1",
        permission: Permissions.ADMIN,
        domain: PERMISSION_DEFAULT_DOMAIN,
      });

      expect(
        await service.has({
          userId: "U1",
          permission: Permissions.ADMIN,
        })
      ).toBe(true);

      await service.remove({
        userId: "U1",
        permission: Permissions.ADMIN,
      });

      expect(
        await service.has({
          userId: "U1",
          permission: Permissions.ADMIN,
        })
      ).toBe(false);
    },
  },
  {
    message: "Should work with nested role",
    async test(service: PermissionService) {
      await service.add({
        userId: "U1",
        permission: Permissions.ADMIN,
        domain: PERMISSION_DEFAULT_DOMAIN,
      });

      expect(
        await service.has({
          userId: "U1",
          permission: Permissions.INVOICE_MANAGEMENT,
        })
      ).toBe(true);

      await service.remove({
        userId: "U1",
        permission: Permissions.ADMIN,
      });

      expect(
        await service.has({
          userId: "U1",
          permission: Permissions.INVOICE_MANAGEMENT,
        })
      ).toBe(false);
    },
  },
  {
    message: "Should work with domains",
    async test(service: PermissionService) {
      await service.add({
        userId: "U1",
        permission: Permissions.ADMIN,
        domain: "Legal",
      });

      expect(
        await service.has({
          userId: "U1",
          permission: Permissions.ADMIN,
        })
      ).toBe(true);

      expect(
        await service.has({
          userId: "U1",
          permission: Permissions.INVOICE_MANAGEMENT,
        })
      ).toBe(true);

      expect(
        await service.has({
          userId: "U1",
          permission: Permissions.ADMIN,
          domain: "Health",
        })
      ).toBe(false);

      expect(
        await service.has({
          userId: "U1",
          permission: Permissions.ADMIN,
          domain: "Legal",
        })
      ).toBe(true);

      expect(
        await service.has({
          userId: "U1",
          permission: Permissions.INVOICE_MANAGEMENT,
          domain: "Legal",
        })
      ).toBe(true);
    },
  },
  {
    message: "Should work with domains and their ids",
    async test(service: PermissionService) {
      await service.add({
        userId: "U1",
        permission: Permissions.ADMIN,
        domain: "Legal",
        domainIdentifier: "BLOCK6",
      });

      expect(
        await service.has({
          userId: "U1",
          permission: Permissions.INVOICE_MANAGEMENT,
          domain: "Legal",
        })
      ).toBe(true);

      expect(
        await service.has({
          userId: "U1",
          permission: Permissions.INVOICE_MANAGEMENT,
          domain: "Legal",
          domainIdentifier: "C4",
        })
      ).toBe(false);

      expect(
        await service.has({
          userId: "U1",
          permission: Permissions.INVOICE_MANAGEMENT,
          domain: "Legal",
          domainIdentifier: "BLOCK6",
        })
      ).toBe(true);
    },
  },
  {
    message: "Should work finding all permissions and all domains",
    async test(service: IPermissionService) {
      await service.add({
        userId: "U1",
        permission: Permissions.ADMIN,
        domain: "Legal",
        domainIdentifier: "BLOCK6",
      });
      await service.add({
        userId: "U1",
        permission: Permissions.ADMIN,
        domain: "Health",
        domainIdentifier: "BLOCK6",
      });

      let permissions, domains;

      permissions = await service.findPermissions({
        userId: "U1",
      });
      expect(permissions).toHaveLength(2);

      permissions = await service.findPermissions({
        userId: "U1",
        domain: "Legal",
      });
      expect(permissions).toHaveLength(1);

      permissions = await service.findPermissions({
        userId: "U1",
        domainIdentifier: "BLOCK6",
      });
      expect(permissions).toHaveLength(2);

      domains = await service.findDomains("U1");
      expect(domains).toHaveLength(2);
      expect(domains.includes("Legal")).toBe(true);
      expect(domains.includes("Health")).toBe(true);
    },
  },
  {
    message: "Should work with roles",
    async test(service: PermissionService) {
      expect(await service.hasRole("U1", Permissions.USER)).toBe(true);
      expect(await service.hasRole("U1", Permissions.ADMIN)).toBe(false);

      await service.add({
        userId: "U1",
        permission: Permissions.ADMIN,
        domain: PERMISSION_DEFAULT_DOMAIN,
      });

      expect(await service.hasRole("U1", Permissions.USER)).toBe(true);
    },
  },
];
