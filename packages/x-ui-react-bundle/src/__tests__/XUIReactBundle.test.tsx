import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import { createSampleKernel } from "./samples";
import { XUIProvider } from "../react/XUIProvider";
import { use, useContainer } from "../react/hooks";
import {
  CustomInitialisingComponent,
  initialisingComponentTest,
  wrappersTest,
  WrappersTestComponent,
} from "./samples/components";
import { XUIReactBundle } from "..";
import { container } from "./ecosystem";

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
      TestRenderer.create(<MyComponent />);
    });

    expect(inRender).toBe(true);
  });

  test("Adding wrappers works", async () => {
    const kernel = createSampleKernel();

    const xuiReactBundle = container.get(XUIReactBundle);

    xuiReactBundle.addWrappers([
      {
        component: WrappersTestComponent,
        props: () => ({
          name: 1,
          test: wrappersTest,
        }),
        order: 20,
      },
      {
        component: WrappersTestComponent,
        props: () => ({
          name: 2,
          test: wrappersTest,
        }),
        order: 10,
      },
      {
        component: WrappersTestComponent,
        props: () => ({
          name: 3,
          test: wrappersTest,
        }),
        order: 30,
      },
    ]);

    const MyComponent = () => (
      <XUIProvider
        kernel={kernel}
        loadingComponent={<CustomInitialisingComponent />}
      >
        <h5>Hello</h5>
      </XUIProvider>
    );

    await TestRenderer.act(async () => {
      TestRenderer.create(<MyComponent />);
    });

    expect(wrappersTest.works).toBe(true);

    expect(wrappersTest.count).toBe(3);

    expect(wrappersTest.orderOfRender).toStrictEqual([2, 1, 3]);

    expect(initialisingComponentTest.isCalled).toBe(true);
  });

  test("useContainer works", async () => {
    const kernel = createSampleKernel();

    const ComponentWrapper = () => {
      return (
        <XUIProvider kernel={kernel}>
          <Component />
        </XUIProvider>
      );
    };

    const Component = () => {
      const container = useContainer();

      container.set("test", 1);

      return null;
    };

    await TestRenderer.act(async () => {
      TestRenderer.create(<ComponentWrapper />);
    });

    expect(kernel.container.get("test")).toBe(1);
  });
});
