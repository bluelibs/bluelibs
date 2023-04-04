import { FacebookAuthenticator } from "./passport.facebook";
import { createKernel } from "./ecosystem";
import { Bundle } from "@bluelibs/core";
import { PassportService } from "../services/PassportService";
import fetch from "node-fetch";
import { ApolloBundle } from "@bluelibs/apollo-bundle";

let kernel;
describe("passport", () => {
  afterEach(async () => {
    if (kernel) {
      await kernel.shutdown();
    }
  });

  test("Should work with fb ", async () => {
    kernel = createKernel();

    class MyBundle extends Bundle {
      async init() {
        const passportService = this.container.get(PassportService);
        passportService.register(FacebookAuthenticator);
      }
    }

    kernel.addBundle(new MyBundle());

    await kernel.init();

    const res = await fetch("http://localhost:6400/auth/facebook");
    const txt = await res.text();
    if (res.status !== 200) {
      expect(txt).toContain("www.facebook.com");
    } else {
      expect(res.status).toBe(200);
    }
  });
});
