import * as React from "react";

import { GuardianSmart } from "..";
import { container, kernel } from "./ecosystem";
import { XUIGuardianProvider } from "../react/provider";
import * as TestRenderer from "react-test-renderer";
import { XUIProvider } from "@bluelibs/x-ui-react-bundle";

describe("UII18NBundle", () => {
  test("Container Injection", async () => {
    const guardianSmart = container.get(GuardianSmart);

    expect(guardianSmart).toBeTruthy();
  });

  test("wrapper works", async () => {
    const Component = () => (
      <XUIProvider kernel={kernel}>
        <XUIGuardianProvider>
          <h5>hello</h5>
        </XUIGuardianProvider>
      </XUIProvider>
    );

    await TestRenderer.act(async () => {
      TestRenderer.create(<Component />);
    });

    expect(true).toBe(true);
  });
});
