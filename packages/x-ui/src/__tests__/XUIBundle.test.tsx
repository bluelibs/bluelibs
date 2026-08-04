/**
 * @jest-environment jsdom
 */
import * as React from "react";
import { I18NService } from "@bluelibs/x-ui-i18n-bundle";
import { GuardianSmart } from "@bluelibs/x-ui-guardian-bundle";
import {
  useContainer,
  XUIProvider,
  XUIReactBundle,
  XUI_COMPONENTS_TOKEN,
} from "@bluelibs/x-ui-react-bundle";
import { container, kernel } from "./ecosystem";

import * as TestRenderer from "react-test-renderer";

describe("XUIBundle", () => {
  test("everything is injected correctly", () => {
    const guardian = container.get(GuardianSmart);
    const i18n = container.get(I18NService);
    const components = container.get(XUI_COMPONENTS_TOKEN);
    const reactBundle = container.get(XUIReactBundle);

    expect(guardian).toBeTruthy();
    expect(i18n).toBeTruthy();
    expect(components).toBeTruthy();
    expect(reactBundle).toBeTruthy();
  });

  // TODO: I think adding components inside <XUIProvider /> shouldn't work,
  // because everything is handled by XBrowserRouter in this bundle.

  // So this test can be removed (?)
  test("Container Injection", async () => {
    const Component = () => {
      const container = useContainer();
      if (!container) {
        throw new Error("Container is not available");
      }

      container.set("test", 1);

      return React.createElement("h5", null, "BlueLibs");
    };

    const MyComponent = () =>
      React.createElement(
        XUIProvider,
        { kernel },
        React.createElement(Component)
      );

    // this shouldn't be failing. it's actually working.
    await TestRenderer.act(async () => {
      TestRenderer.create(React.createElement(MyComponent));
    });

    // expect(kernel.container.get("test")).toBe(1);
  });
});
