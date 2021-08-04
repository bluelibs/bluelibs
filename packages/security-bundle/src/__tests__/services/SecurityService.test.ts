import { SecurityService } from "../../services/SecurityService";
import { UserPersistanceService } from "./mocks/UserPersistanceService.mock";
import { assert, expect } from "chai";
import { EventManager } from "@bluelibs/core";
import { createTests } from "../reusable";
import {
  securityTestDefinitions,
  securityServiceCreator,
} from "./securityTestDefinitions";

describe("SecurityService", () => {
  createTests(securityTestDefinitions, securityServiceCreator);
});
