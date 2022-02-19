import { PasswordService } from "@bluelibs/password-bundle";
import { SecurityService } from "@bluelibs/security-bundle";
import {
  AUTH_CODE_COLLECTION_TOKEN,
  InvalidPasswordException,
  InvalidUsernameException,
  MAGIC_AUTH_STRATEGY,
  PASSWORD_STRATEGY,
  UsernameAlreadyExistsException,
  XAuthBundle,
  XAuthService,
  X_AUTH_SETTINGS,
} from "../..";
import { createEcosystem } from "../createEcosystem";

describe("XAuthService.test ", () => {
  let securityService, passwordService, xAuthService, container;
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
    xAuthService = container.get(XAuthService);

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
      xAuthService.register({
        ...newUser,
        email: dummyUser.username,
      })
    ).rejects.toThrow(UsernameAlreadyExistsException);
    const registerResult = await xAuthService.register({
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
      xAuthService.login({ ...dummyUser, password: "xxx" })
    ).rejects.toThrow(InvalidPasswordException);
    await expect(
      xAuthService.login({ ...dummyUser, username: "xxx" })
    ).rejects.toThrow(InvalidUsernameException);
    const loginResult = await xAuthService.login(dummyUser);
    expect(loginResult).toBeDefined();
    expect(
      (await securityService.getSession(loginResult.token)).userId
    ).toEqual(userId);
  });

  test("requestLoginLink", async () => {
    const requestLoginLinkResults = await xAuthService.requestLoginLink({
      username: dummyUser.username,
    });
    expect(requestLoginLinkResults.magicCodeSent).toEqual(true);
    expect(requestLoginLinkResults.userId).toEqual(userId);
    await expect(
      xAuthService.requestLoginLink({
        username: dummyUser.username + "11",
      })
    ).rejects.toThrow(InvalidUsernameException);
  });

  test("verifyLoginCode", async () => {
    await container.get(AUTH_CODE_COLLECTION_TOKEN).insertOne({
      userId,
      leftSubmissionsCount: 3,
      code: "123456",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });
    await expect(
      xAuthService.verifyMagicCode({
        userId,
        magicCode: "000000",
      })
    ).rejects.toThrow();
    const codeAuthSession = await container
      .get(AUTH_CODE_COLLECTION_TOKEN)
      .findOne({ userId });
    expect(codeAuthSession.leftSubmissionsCount).toEqual(2);
    const result = await xAuthService.verifyMagicCode({
      userId,
      magicCode: codeAuthSession.code,
    });
    expect((await securityService.getSession(result.token)).userId).toEqual(
      userId
    );
  });
});
