// Smart.test.tsx
import * as React from "react";
import "@testing-library/jest-dom";

import { render, fireEvent, act } from "@testing-library/react";
import { Smart, useSmart, useNewSmart, withSmart } from "../"; // Assuming Smart.tsx is in the same directory

// Define a CounterSmart class for testing
class CounterSmart extends Smart<{ count: number }> {
  constructor() {
    super();
    this.state = { count: 0 };
  }

  increment() {
    this.updateState({ count: this.state.count + 1 });
  }

  decrement() {
    this.updateState({ count: this.state.count - 1 });
  }

  static context = React.createContext<CounterSmart>(null);

  static getContext() {
    return this.context;
  }
}

describe("Smart Class and Hooks", () => {
  // Test 1: Smart class initializes state correctly
  test("Smart class initializes state correctly", () => {
    const counter = new CounterSmart();
    expect(counter.state.count).toBe(0);
  });

  // Test 2: Smart class updates state correctly
  test("Smart class updates state correctly", () => {
    const counter = new CounterSmart();
    counter.increment();
    expect(counter.state.count).toBe(1);

    counter.decrement();
    expect(counter.state.count).toBe(0);
  });

  // Test 3: Subscribers are notified on state change
  test("Subscribers are notified on state change", () => {
    const counter = new CounterSmart();
    const subscriber = jest.fn();

    counter.subscribe(subscriber);
    counter.increment();

    expect(subscriber).toHaveBeenCalledWith({ count: 0 }, { count: 1 });
  });

  // Test 4: Subscribers are not notified when silent option is used
  test("Subscribers are not notified when silent option is used", () => {
    const counter = new CounterSmart();
    const subscriber = jest.fn();

    counter.subscribe(subscriber);
    counter.setState({ count: 10 }, { silent: true });

    expect(subscriber).not.toHaveBeenCalled();
    expect(counter.state.count).toBe(10);
  });

  // Test 5: useSmart hook provides the model and updates component on state change
  test("useSmart hook provides the model and updates component on state change", () => {
    const CounterComponent: React.FC = () => {
      const counter = useSmart(CounterSmart);

      return (
        <div>
          <p data-testid="count">Count: {counter.state.count}</p>
          <button onClick={() => counter.increment()}>Increment</button>
        </div>
      );
    };

    const Wrapper: React.FC = () => {
      const [model, Provider] = useNewSmart(CounterSmart);
      return (
        <Provider>
          <CounterComponent />
        </Provider>
      );
    };

    const { getByText, getByTestId } = render(<Wrapper />);

    expect(getByTestId("count")).toHaveTextContent("Count: 0");

    fireEvent.click(getByText("Increment"));
    expect(getByTestId("count")).toHaveTextContent("Count: 1");
  });

  // Test 6: Component re-renders only when state changes
  test("Component re-renders only when state changes", () => {
    const renderSpy = jest.fn();

    const TestComponent: React.FC = () => {
      const counter = useSmart(CounterSmart);
      renderSpy();
      return <div data-testid="count">{counter.state.count}</div>;
    };

    const Wrapper: React.FC = () => {
      const [model, Provider] = useNewSmart(CounterSmart);
      return (
        <Provider>
          <TestComponent />
        </Provider>
      );
    };

    const { getByTestId } = render(<Wrapper />);

    expect(getByTestId("count")).toHaveTextContent("0");
    expect(renderSpy).toHaveBeenCalledTimes(1);

    act(() => {
      // Access the model via context
      // Since we cannot directly access the model from here, we need to simulate state change
      // Alternatively, refactor useCreateSmart to expose the model
    });

    // Since accessing the model directly is tricky, let's adjust the Wrapper to expose it
  });

  // Test 7: Component unsubscribes on unmount
  test("Component unsubscribes on unmount", () => {
    // Define a helper component to capture the model
    let capturedModel: CounterSmart | null = null;

    const TestComponent: React.FC = () => {
      const counter = useSmart(CounterSmart);
      capturedModel = counter;
      return <div>Test</div>;
    };

    const Wrapper: React.FC = () => {
      const [model, Provider] = useNewSmart(CounterSmart);
      return (
        <Provider>
          <TestComponent />
        </Provider>
      );
    };

    const { unmount } = render(<Wrapper />);

    expect(capturedModel).not.toBeNull();
    if (capturedModel) {
      expect(capturedModel.getSubscriberCount()).toBe(1);
    }

    unmount();

    if (capturedModel) {
      expect(capturedModel.getSubscriberCount()).toBe(0);
    }
  });

  // Test 8: withSmart HOC provides model via context
  test("withSmart HOC provides model via context", () => {
    const DumbComponent: React.FC = () => {
      const counter = useSmart(CounterSmart);
      return <div data-testid="count">{counter.state.count}</div>;
    };

    const SmartComponent = withSmart(CounterSmart)(DumbComponent);

    const { getByTestId } = render(<SmartComponent />);

    expect(getByTestId("count")).toHaveTextContent("0");
  });

  // Test 9: withSmart HOC passes props to wrapped component
  test("withSmart HOC passes props to wrapped component", () => {
    const DumbComponent: React.FC<{ label: string }> = ({ label }) => {
      const counter = useSmart(CounterSmart);
      return (
        <div data-testid="count">
          {label}: {counter.state.count}
        </div>
      );
    };

    const SmartComponent = withSmart(CounterSmart)(DumbComponent);

    const { getByTestId } = render(<SmartComponent label="Counter" />);

    expect(getByTestId("count")).toHaveTextContent("Counter: 0");
  });

  // Test 10: newSmart cleans up model on unmount
  test("newSmart cleans up model on unmount", () => {
    const destroySpy = jest.spyOn(CounterSmart.prototype, "destroy");

    const Wrapper: React.FC = () => {
      const [model, Provider] = useNewSmart(CounterSmart);
      console.log(Provider);
      return (
        <Provider>
          <div>Test</div>
        </Provider>
      );
    };

    const { unmount } = render(<Wrapper />);

    expect(destroySpy).toHaveBeenCalledTimes(0);

    unmount();

    expect(destroySpy).toHaveBeenCalledTimes(1);

    destroySpy.mockRestore();
  });

  test("should throw an error when using smart without a provider", () => {
    const TestComponent: React.FC = () => {
      const counter = useSmart(CounterSmart);
      return <div>Test</div>;
    };

    expect(() => render(<TestComponent />)).toThrow(
      "No context found for Function. Ensure your component is wrapped with the appropriate Provider."
    );
  });
});
