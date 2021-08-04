import { createTests } from "../reusable";
import {
  permissionServiceTestDefinitions,
  permissionServiceCreator,
} from "./permissionsTestDefinitions";

describe("PermissionService", () => {
  createTests(permissionServiceTestDefinitions, permissionServiceCreator);
});
