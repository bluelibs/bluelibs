import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import { newSmart, smart, useSmart } from "../hooks";
import { Smart } from "../Smart";

const StandardContext = React.createContext(null);

interface IState {
  count: number;
  ready?: boolean;
}

interface IConfig {
  something: boolean;
}

test("It should work with init() and destroy()", () => {
  // Do something alright.

  let currentModel;

  class CounterModel extends Smart<IState, IConfig> {
    state = {
      count: 1,
    };

    public ready = false;
    public destroyed = false;

    increment() {
      this.updateState({ count: this.state.count + 1 });
    }

    async init() {
      currentModel = this;
      this.ready = true;

      this.updateState({
        ready: true,
      });
    }

    async destroy() {
      this.destroyed = true;
    }

    static getContext = () => StandardContext;
  }

  function SubTestComponent() {
    const api = useSmart(CounterModel);

    const { count } = api.state;
    return (
      <div>
        Hello! <br />
        <span>{count}</span>
        <button onClick={() => api.increment()}>Increment</button>
      </div>
    );
  }

  const TestComponent = smart(CounterModel, {
    something: true,
  })(SubTestComponent);

  const testRenderer = TestRenderer.create(<TestComponent />);
  const testInstance = testRenderer.root;

  TestRenderer.act(() => {
    testInstance.findByType("button").props.onClick();
  });

  expect(testInstance.findByType("span").children).toStrictEqual(["2"]);

  TestRenderer.act(() => {
    testRenderer.unmount();
  });

  expect(currentModel.destroyed).toBe(true);
  expect(currentModel.ready).toBe(true);
});
