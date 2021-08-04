import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import { createSampleKernel } from "./samples";
import { XUIProvider } from "../react/XUIProvider";
import { use } from "../react/hooks";
import { resolve } from "url";

const awaitKernelInit = (kernel) => {
  return new Promise<void>((resolve) => {
    kernel.onInit(() => {
      resolve();
    });
  });
};

describe("XUIProvider", () => {
  test("Container Injection", async () => {
    const kernel = createSampleKernel();
    let inRender = false;
    const value = {};
    kernel.container.set("id", value);
    const SubComponent = () => {
      inRender = true;
      const myValue = use("id");
      expect(myValue).toEqual(value);

      return null;
    };

    const MyComponent = () => (
      <XUIProvider kernel={kernel}>
        <SubComponent />
      </XUIProvider>
    );

    await TestRenderer.act(async () => {
      const testRenderer = TestRenderer.create(<MyComponent />);
    });
    expect(inRender).toBe(true);
  });

  test("Routing in works", async () => {});
});
