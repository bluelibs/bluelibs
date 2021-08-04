/**
 * WHY?
 *
 * This is helpful when you are building a new authentication module and you're writing tests for it
 * Then it would be useful for you to have access to mocked security and permission services, that simply work
 * without caring about persistance layer.
 *
 * This is also helpful when you're building persistance layers, you would want to inject your own
 * persistance layer into the security service and you would like all the tests to pass without having
 * to write your own extra test.
 */

export {
  permissionServiceTestDefinitions,
  permissionServiceCreator,
} from "./services/permissionsTestDefinitions";
export {
  securityTestDefinitions,
  securityServiceCreator,
} from "./services/securityTestDefinitions";
import { PermissionsPersistanceService } from "./services/mocks/PermissionsPersistanceService.mock";
import {
  PermissionTree,
  Permissions,
} from "./services/mocks/permissionTree.mock";

import { UserPersistanceService } from "./services/mocks/UserPersistanceService.mock";

export const Mocks = {
  PermissionsPersistanceService,
  PermissionTree,
  Permissions,
  UserPersistanceService,
};

export function createTests(testDefinitions, injectionCreator) {
  testDefinitions.forEach(({ message, test, only }) => {
    if (only) {
      it.only(message, async () => {
        await test(injectionCreator());
      });
    } else {
      it(message, async () => {
        await test(injectionCreator());
      });
    }
  });
}
