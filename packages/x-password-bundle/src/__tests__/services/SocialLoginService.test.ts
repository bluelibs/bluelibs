import { PasswordService } from "@bluelibs/password-bundle";
import { SecurityService } from "@bluelibs/security-bundle";
import { XPasswordService } from "../..";
import { createEcosystem } from "../createEcosystem";
import * as superagent from "superagent";
import { HTTPBundle } from "@bluelibs/http-bundle";
import userData from "../mocks/userData";
import StrategyMock from "../mocks/mockStrategy";

describe("SocialLoginService.test ", () => {
  let securityService,
    passwordService,
    xPasswordService,
    container,
    app,
    userId: any;

  beforeEach(async () => {
    container = await createEcosystem({
      socialAuth: {
        profileObjectPath: {
          "mock-oauth2": [],
        },
        socialUniqueIds: {
          "mock-oauth2": "id",
        },

        importStrategyMap: {
          "mock-oauth2": StrategyMock,
        },
        socialCustomConfig: {
          "mock-oauth2": {
            credentialsKeys: {
              clientID: "passReqToCallback",
              clientSecret: "passAuthentication",
            },
          },
        },
        services: {
          "mock-oauth2": {
            settings: {
              clientID: "true",
              clientSecret: "true",
            },
            url: {
              auth: "/auth/mock",
              callback: "/auth/mock/callback",
              success: "http://localhost:8080/social-auth",
              fail: "http://localhost:8080/error",
            },
          },
        },

        url: "http://127.0.0.1:5000", // this will be the express app  url
      },
    });

    securityService = container.get(SecurityService);
    passwordService = container.get(PasswordService);
    xPasswordService = container.get(XPasswordService);
    app = container.get(HTTPBundle).app;
  });

  afterEach(async () => {
    if (userId) await securityService.deleteUser(userId);
  });

  test("test mock passport strategy", async () => {
    await superagent
      .get("http://localhost:5000/auth/mock")
      .end((res, err) => {});
    userId = await securityService.findUser({
      "password.username": userData.email,
      "profile.firstName": userData.firstName,
      "profile.lastName": userData.lastName,
    });
    expect(userId).toBeDefined();
  });
});
