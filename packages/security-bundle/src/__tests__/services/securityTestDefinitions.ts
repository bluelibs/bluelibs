import { SecurityService } from "../..";
import { UserPersistanceService } from "./mocks/UserPersistanceService.mock";
import { EventManager } from "@bluelibs/core";
import { SessionPersistanceService } from "./mocks/SessionPersistanceService.mock";
import { ISessionData } from "../../defs";

declare module "../../defs" {
  interface ISessionData {
    a: any;
  }
}

export const securityTestDefinitions = [
  {
    message: "Standard user creation and manipulation",
    async test(securityService: SecurityService) {
      let userId, user;
      userId = await securityService.createUser({});

      await securityService.updateUser(userId, {
        name: "Hello",
      });

      user = await securityService.findUserById(userId);
      expect(user.name).toBe("Hello");
    },
  },
  {
    message: "Should allow authentication",
    async test(securityService: SecurityService) {
      let userId, user;
      userId = await securityService.createUser({});

      const token = await securityService.createSession(userId, {
        data: {
          a: "TEST",
        },
      });

      const tokenData = await securityService.getSession(token);

      expect(tokenData.userId.toString()).toBe(userId.toString());
      expect(tokenData.data?.a).toBe("TEST");
    },
  },
  {
    message: "Should allow logging out",
    async test(securityService: SecurityService) {
      let userId, token;
      userId = await securityService.createUser({});

      token = await securityService.createSession(userId);
      const tokenData = await securityService.getSession(token);

      await securityService.logout(token);
      const newValue = await securityService.getSession(token);

      expect(newValue).toBe(null);
    },
  },
];

export function securityServiceCreator(): SecurityService {
  const userPersistance = new UserPersistanceService();
  const sessionPersistance = new SessionPersistanceService();
  const eventManager = new EventManager();

  return new SecurityService(userPersistance, sessionPersistance, eventManager);
}
