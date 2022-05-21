import { PasswordService } from "@bluelibs/password-bundle";
import { SecurityService } from "@bluelibs/security-bundle";
import {
  InvalidPasswordException,
  InvalidUsernameException,
  MAGIC_AUTH_STRATEGY,
  PASSWORD_STRATEGY,
  UsernameAlreadyExistsException,
  XPasswordBundle,
  XPasswordService,
  MultipleFactorService,
  X_PASSWORD_SETTINGS,
} from "../..";
import { createEcosystem } from "../createEcosystem";

describe("MultipleFactorService.test ", () => {
  let securityService,
    passwordService,
    xPasswordService,
    container,
    multipleFactorService;
  let userId;
  const dummyUser = {
    password: "123456",
    profile: { firstName: "aa", lastName: "bb" },
    lastName: "bb",
    username: "john@johnny.com",
  };
  beforeEach(async () => {
    container = await createEcosystem({
      multipleFactorAuth: {
        factors: [
          {
            strategy: PASSWORD_STRATEGY,
            redirectUrl: "http://localhost:8080/login",
          },
          {
            strategy: MAGIC_AUTH_STRATEGY,
            redirectUrl: "http://localhost:8080/request-magic-link",
          },
        ],
        userHaveToMultipleFactorAuth: async (userId) => true,
      },
    });
    multipleFactorService = container.get(MultipleFactorService);
    securityService = container.get(SecurityService);
    passwordService = container.get(PasswordService);
    xPasswordService = container.get(XPasswordService);

    //prepare user sample
    userId = await securityService.createUser();
    await passwordService.attach(userId, dummyUser);
    await securityService.updateUser(userId, {
      profile: dummyUser.profile,
      isEnabled: true,
    });
  });

  afterEach(async () => {
    await securityService.deleteUser(userId);
  });

  test("test session token login", async () => {
    const firstLogin = await multipleFactorService.login(userId, {
      authenticationStrategy: MAGIC_AUTH_STRATEGY,
    });
    expect(firstLogin.redirectUrl.split("?")[0]).toEqual(
      "http://localhost:8080/login"
    );

    expect(firstLogin.strategy).toEqual(PASSWORD_STRATEGY);

    const secondLogin = await multipleFactorService.login(userId, {
      authenticationStrategy: PASSWORD_STRATEGY,
      data: {
        sessionToken: firstLogin.sessionToken,
      },
    });
    expect(
      (await securityService.getSession(secondLogin.token)).userId
    ).toEqual(userId);
  });
});
