import { Bundle } from "@bluelibs/core";
import { HTTPBundle } from "../HTTPBundle";
import { createKernel } from "./ecosystem";
import * as express from "express";
import fetch from "node-fetch";

test("Initialises and works", async () => {
  const kernel = createKernel();

  class MyBundle extends Bundle {
    async prepare() {
      this.container.set("value", "OKEY");
    }
    async init() {
      const httpBundle = this.container.get(HTTPBundle);

      expect(httpBundle.app).toBeTruthy();
      expect(httpBundle.router).toBeTruthy();

      httpBundle.addRoutes([
        {
          type: "get",
          path: "/users/:userId",
          async handler(container, req, res, next) {
            res.json({
              value: container.get("value"),
              userId: req.params.userId,
            });
          },
        },
      ]);
    }
  }

  kernel.addBundle(new MyBundle());
  await kernel.init();

  const result = await fetch("http://localhost:6000/users/123");
  const json = await result.json();

  expect(json.userId).toBe("123"), expect(json.value).toBe("OKEY");

  await kernel.shutdown();
});
