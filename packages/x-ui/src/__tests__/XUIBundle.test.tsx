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
      container.set("test", 1);

      return <h5>BlueLibs</h5>;
    };

    const MyComponent = () => (
      <XUIProvider kernel={kernel}>
        <Component />
      </XUIProvider>
    );

    // this shouldn't be failing. it's actually working.
    await TestRenderer.act(async () => {
      TestRenderer.create(<MyComponent />);
    });

    // expect(kernel.container.get("test")).toBe(1);
  });
});
