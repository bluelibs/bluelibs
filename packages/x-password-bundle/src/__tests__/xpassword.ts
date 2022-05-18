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
  X_PASSWORD_SETTINGS,
} from "../..";
import { createEcosystem } from "./createEcosystem";

describe("xpasswordService ", () => {
  let securityService, passwordService, xPasswordService, container;
  let userId;
  const dummyUser = {
    password: "123456",
    profile: { firstName: "aa", lastName: "bb" },
    lastName: "bb",
    username: "john@johnny.com",
  };
  beforeEach(async () => {
    container = await createEcosystem();
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

  test("register", async () => {
    const newUser = {
      firstName: "aa",
      lastName: "bb",
      password: "1234",
    };
    await expect(
      xPasswordService.register({
        ...newUser,
        email: dummyUser.username,
      })
    ).rejects.toThrow(UsernameAlreadyExistsException);
    const registerResult = await xPasswordService.register({
      ...newUser,
      email: "00" + dummyUser.username,
    });
    expect(registerResult).toBeDefined();
    expect(
      (await securityService.getSession(registerResult.token)).userId
    ).toEqual(registerResult.userId);
    await securityService.deleteUser(registerResult.userId);
  });

  test("login", async () => {
    await expect(
      xPasswordService.login({ ...dummyUser, password: "xxx" })
    ).rejects.toThrow(InvalidPasswordException);
    await expect(
      xPasswordService.login({ ...dummyUser, username: "xxx" })
    ).rejects.toThrow(InvalidUsernameException);
    const loginResult = await xPasswordService.login(dummyUser);
    expect(loginResult).toBeDefined();
    expect(
      (await securityService.getSession(loginResult.token)).userId
    ).toEqual(userId);
  });

  test("requestLoginLink", async () => {
    const requestLoginLinkResults = await xPasswordService.requestLoginLink({
      username: dummyUser.username,
    });
    expect(requestLoginLinkResults.magicCodeSent).toEqual(true);
    expect(requestLoginLinkResults.userId).toEqual(userId);
    await expect(
      xPasswordService.requestLoginLink({
        username: dummyUser.username + "11",
      })
    ).rejects.toThrow(InvalidUsernameException);
  });

  test("requestLoginLink", async () => {
    await securityService.createSession(userId, {
      token: "123456",
      data: {
        token: "123456",
        leftSubmissionsCount: 3,
        type: "magic-link-auth",
      },
    });
    await expect(
      xPasswordService.verifyMagicCode({
        userId,
        magicCode: "",
      })
    ).rejects.toThrow();
    const session = await securityService.findSession(userId, {});
    expect(session.data.leftSubmissionsCount).toEqual(2);
    const result = await xPasswordService.verifyMagicCode({
      userId,
      magicCode: session.token,
    });
    expect((await securityService.getSession(result.token)).userId).toEqual(
      userId
    );
  });
});
