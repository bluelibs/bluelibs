import { createTests } from "../reusable";
import {
  securityTestDefinitions,
  securityServiceCreator,
} from "./securityTestDefinitions";

describe("SecurityService", () => {
  createTests(securityTestDefinitions, securityServiceCreator);
});
