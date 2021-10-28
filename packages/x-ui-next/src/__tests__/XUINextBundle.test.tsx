import * as React from "react";
import { kernel } from "./ecosystem";

import * as TestRenderer from "react-test-renderer";
import { useRouter } from "../react/hooks";
import { XUIProvider } from "@bluelibs/x-ui-react-bundle";

describe("XUIBundle", () => {
  test("Container Injection", async () => {
    const TestComponent = () => {
      const router = useRouter();

      return <h5>Works</h5>;
    };

    const WrapperComponent = () => (
      <XUIProvider kernel={kernel}>
        <TestComponent />
      </XUIProvider>
    );

    await TestRenderer.act(async () => {
      TestRenderer.create(<WrapperComponent />);
    });
  });
});
