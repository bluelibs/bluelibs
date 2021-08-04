import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import { newSmart, smart, useSmart } from "../hooks";
import { Smart } from "../Smart";

interface IState {
  count: number;
}

interface IConfig {
  something: boolean;
}

const StandardContext = React.createContext(null);

class CounterModel extends Smart<IState, IConfig> {
  state = {
    count: 1,
  };

  increment() {
    this.setState({ count: this.state.count + 1 });
  }

  static getContext = () => StandardContext;
}

function Intermediary(props) {
  return <SubTestComponent />;
}

const IntermediaryMemo = React.memo(Intermediary);

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

test("It should work", () => {
  // Do something alright.

  function TestComponent() {
    const [api, Provider] = newSmart(CounterModel, {
      something: true,
    });

    return (
      <Provider>
        <IntermediaryMemo />
      </Provider>
    );
  }

  const testRenderer = TestRenderer.create(<TestComponent />);
  const testInstance = testRenderer.root;

  TestRenderer.act(() => {
    testInstance.findByType("button").props.onClick();
  });

  expect(testInstance.findByType("span").children).toStrictEqual(["2"]);
  // expect(testInstance.findByType(SubTestComponent)).to
});

test("It should work with factory", () => {
  // Do something alright.

  let inFactory = false;
  function TestComponent() {
    const [api, Provider] = newSmart(
      CounterModel,
      {
        something: true,
      },
      {
        factory: (targetType, config) => {
          inFactory = true;
          return new targetType();
        },
      }
    );

    return (
      <Provider>
        <IntermediaryMemo />
      </Provider>
    );
  }

  const testRenderer = TestRenderer.create(<TestComponent />);
  const testInstance = testRenderer.root;

  TestRenderer.act(() => {
    testInstance.findByType("button").props.onClick();
  });

  expect(inFactory).toBe(true);
  expect(testInstance.findByType("span").children).toStrictEqual(["2"]);
  // expect(testInstance.findByType(SubTestComponent)).to
});

test("It should work", () => {
  // Do something alright.

  const TestComponent = smart(CounterModel, {
    something: true,
  })(SubTestComponent);

  const testRenderer = TestRenderer.create(<TestComponent />);
  const testInstance = testRenderer.root;

  TestRenderer.act(() => {
    testInstance.findByType("button").props.onClick();
  });

  expect(testInstance.findByType("span").children).toStrictEqual(["2"]);
  // expect(testInstance.findByType(SubTestComponent)).to
});
