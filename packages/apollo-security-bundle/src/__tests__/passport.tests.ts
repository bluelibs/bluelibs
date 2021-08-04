import { Strategy as FacebookStrategy } from "passport-facebook";
import * as passport from "passport";
import { FacebookAuthenticator } from "./passport.facebook";
import { createKernel } from "./ecosystem";
import { Bundle } from "@bluelibs/core";
import { PassportService } from "../services/PassportService";
import fetch from "node-fetch";
import { ApolloBundle } from "@bluelibs/apollo-bundle";

describe("passport", () => {
  test("Should work with fb ", async () => {
    const kernel = createKernel();

    class MyBundle extends Bundle {
      async init() {
        const passportService = this.container.get(PassportService);
        passportService.register(FacebookAuthenticator);
      }
    }

    kernel.addBundle(new MyBundle());

    await kernel.init();

    const res = await fetch("http://localhost:5000/auth/facebook");
    expect(res.status).toBe(200);

    // Closing after so tests work nicely
    kernel.container.get(ApolloBundle).httpServer.close();
  });
});
