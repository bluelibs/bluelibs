import { createEcosystem } from "./createEcosystem";

import { SecurityService } from "@bluelibs/security-bundle";
import { PasswordService } from "@bluelibs/password-bundle";
import { XPasswordService } from "../../services/XPasswordService";
import { ContainerInstance, Kernel } from "@bluelibs/core";
import { X_PASSWORD_SETTINGS } from "../../constants";

describe("cache manager tests get/set", () => {
  let container: ContainerInstance;

  describe("cacheService getter/setter", () => {
    it("URL should work", async () => {
      container = await createEcosystem();
      console.log(container);
      const config = container?.get(X_PASSWORD_SETTINGS);
      console.log("***********config", config);
      /* const securityService = container.get(SecurityService);

      const xpasswordService = container.get(XPasswordService);

      const passwordService = container.get(PasswordService);

      const userId = await securityService.createUser();
      await passwordService.attach(userId, {
        password: "123456",
        username: "john@johnny.com",
      });
      console.log("userId", userId);
      expect(await passwordService.isPasswordValid(userId, "123456")).toBe(
        true
      );

      console.log(
        "******token",
        await xpasswordService.login({
          username: "john@johnny.com",
          password: "123456",
        })
      );
      expect(await passwordService.isPasswordValid(userId, "1x23456")).toBe(
        false
      );
      await securityService.deleteUser(userId);
      //await kernel.shutdown();*/
      expect(config).toBeDefined();
      //await container?.get(Kernel)?.shutdown();
    });
  });
});
