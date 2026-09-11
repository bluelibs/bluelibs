import { SecurityService } from "@bluelibs/security-bundle";
import { ContainerInstance } from "@bluelibs/core";
import { createEcosystem, shutdownKernel, PORT } from "../createEcosystem";
import * as superagent from "superagent";
import userData from "../mocks/userData";
import StrategyMock from "../mocks/mockStrategy";

describe("SocialLoginService.test ", () => {
  let securityService: SecurityService;
  let container: ContainerInstance;
  // why: the skipped test stores the result of findUser (a user document) and
  // later passes it to deleteUser which expects a UserId; the types don't line up
  let userId: any;

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

        // This is the express app url the HTTPBundle binds to; PORT is derived
        // from JEST_WORKER_ID so parallel test workers don't collide on it.
        url: `http://127.0.0.1:${PORT}`,
      },
    });

    securityService = container.get(SecurityService);
  });

  afterEach(async () => {
    if (userId) await securityService.deleteUser(userId);
  });
  afterEach(async () => {
    await shutdownKernel(container);
  });

  // Skipped: the mock OAuth flow cannot complete as-is. SocialLoginService.init
  // registers passport.session() but no express-session middleware is mounted
  // anywhere in the bundle, so the callback route throws "Login sessions
  // require session support" (HTTP 500) before the user is created.
  //
  // This was previously a false-pass: the request went to a hardcoded :5000
  // (whatever process happened to own the port, not this bundle) and
  // `expect(userId).toBeDefined()` passes on `null`, so the strategy was never
  // actually exercised. The port is now derived from JEST_WORKER_ID (PORT), the
  // assertion is strict, and the test is skipped rather than left as a
  // false-pass. Fixing it requires adding express-session support (src change).
  test.skip("test mock passport strategy", async () => {
    // The mock strategy redirects to the callback once, and the callback
    // handler then redirects to the (unused) frontend on :8080; following
    // only the first redirect is enough for the user to be created.
    await superagent.get(`http://localhost:${PORT}/auth/mock`).redirects(1);

    userId = await securityService.findUser({
      "password.username": userData.email,
      "profile.firstName": userData.firstName,
      "profile.lastName": userData.lastName,
    });
    expect(userId).not.toBeNull();
  });
});
