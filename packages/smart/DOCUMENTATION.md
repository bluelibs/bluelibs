# Smart State Management Library

Welcome to the **Smart** State Management Library — a lightweight, intuitive, and powerful solution for managing state in React applications. **Smart** is designed to simplify state handling, providing developers with a flexible architecture that seamlessly integrates with React's ecosystem. Whether you're building small components or large-scale applications, **Smart** offers the tools you need to create scalable and maintainable codebases.

## Table of Contents

- [Smart State Management Library](#smart-state-management-library)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Installation](#installation)
  - [Getting Started](#getting-started)
    - [Creating a Smart Model](#creating-a-smart-model)
    - [Using the `useSmart` Hook](#using-the-usesmart-hook)
    - [Using the `withSmart` HOC](#using-the-withsmart-hoc)
  - [Advanced Usage](#advanced-usage)
    - [Customizing Smart Creation](#customizing-smart-creation)
    - [Silent State Updates](#silent-state-updates)
  - [Testing](#testing)
    - [Jest Configuration](#jest-configuration)
    - [TypeScript Configuration](#typescript-configuration)
  - [API Reference](#api-reference)
    - [Smart Class](#smart-class)
      - [**Class: Smart**](#class-smart)
      - [**Types**](#types)
    - [Hooks and HOCs](#hooks-and-hocs)
      - [**useSmart Hook**](#usesmart-hook)
      - [**newSmart Hook**](#newsmart-hook)
      - [**withSmart HOC**](#withsmart-hoc)
  - [Examples](#examples)
    - [Simple Counter Example](#simple-counter-example)
    - [Higher-Order Component Example](#higher-order-component-example)
  - [Contributing](#contributing)
  - [License](#license)

## Features

- **Simple State Management**: Manage your state with ease using the `Smart` class and React Hooks.
- **TypeScript Support**: Fully typed with TypeScript for enhanced developer experience and type safety.
- **React Integration**: Seamlessly integrates with React through custom Hooks and Higher-Order Components (HOCs).
- **Subscriber Notifications**: Subscribe to state changes and react accordingly.
- **Flexible Configuration**: Customize the behavior of your Smart models as needed.
- **Testing Ready**: Designed with testing in mind, ensuring your state management logic is reliable.

## Installation

Install the **Smart** library via npm or yarn:

```bash
# Using npm
npm install @bluelibs/smart

# Using yarn
yarn add @bluelibs/smart
```

## Getting Started

### Creating a Smart Model

Start by creating a subclass of the `Smart` class tailored to your specific state needs. For example, let's create a simple counter model.

```typescript
// CounterSmart.tsx
import React, { createContext } from "react";
import { Smart } from "@bluelibs/smart";

type CounterState = {
  count: number;
};

export class CounterSmart extends Smart<CounterState> {
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

  static context = createContext<CounterSmart>(null as any);

  static getContext() {
    return this.context;
  }
}
```

### Using the `useSmart` Hook

The `useSmart` Hook allows your React components to access and interact with the Smart model.

```tsx
// CounterComponent.tsx
import React from "react";
import { useSmart } from "@bluelibs/smart";
import { CounterSmart } from "./CounterSmart";

const CounterComponent: React.FC = () => {
  const counter = useSmart(CounterSmart);

  return (
    <div>
      <p>Count: {counter.state.count}</p>
      <button onClick={() => counter.increment()}>Increment</button>
      <button onClick={() => counter.decrement()}>Decrement</button>
    </div>
  );
};

export default CounterComponent;
```

### Using the `withSmart` HOC

Alternatively, you can use the `withSmart` Higher-Order Component to inject the Smart model into your components.

```tsx
// App.tsx
import React from "react";
import { withSmart } from "@bluelibs/smart";
import { CounterSmart } from "./CounterSmart";
import CounterComponent from "./CounterComponent";

const SmartCounter = withSmart(CounterSmart)(CounterComponent);

const App: React.FC = () => {
  return (
    <div>
      <h1>Smart Counter</h1>
      <SmartCounter />
    </div>
  );
};

export default App;
```

## Advanced Usage

### Customizing Smart Creation

You can customize how Smart models are created by providing a factory function or setting default options.

```typescript
// customFactory.ts
import { Smart, INewSmartOptions, SmartConstructor } from "@bluelibs/smart";

export function customFactory<S, U, T extends Smart<S, U>>(
  targetType: SmartConstructor<S, U>,
  config: U
): T {
  const model = new targetType();
  // Customize the model as needed
  return model;
}

// Usage
import { newSmart, setDefaults } from "@bluelibs/smart";
import { CounterSmart } from "./CounterSmart";
import { customFactory } from "./customFactory";

setDefaults({
  factory: customFactory,
});

const [counter, Provider] = newSmart(CounterSmart, {
  /* config */
});
```

### Silent State Updates

Sometimes you might want to update the state without notifying subscribers immediately. Use the `silent` option for this purpose.

```typescript
counter.setState({ count: 10 }, { silent: true });
// Subscribers won't be notified
counter.inform(); // Manually inform subscribers when ready
```

## Testing

**Smart** is designed to work seamlessly with testing frameworks like Jest and React Testing Library. Below is an example of how to test a component using the `Smart` library.

```typescript
// CounterComponent.test.tsx
import React from "react";
import { render, fireEvent } from "@testing-library/react";
import { CounterSmart } from "./CounterSmart";
import { useSmart, createSmart, withSmart } from "@bluelibs/smart";
import "@testing-library/jest-dom/extend-expect";

// Define a test component
const CounterComponent: React.FC = () => {
  const counter = useSmart(CounterSmart);

  return (
    <div>
      <p data-testid="count">Count: {counter.state.count}</p>
      <button onClick={() => counter.increment()}>Increment</button>
      <button onClick={() => counter.decrement()}>Decrement</button>
    </div>
  );
};

// Create a wrapper with the Provider
const Wrapper: React.FC = () => {
  const [model, Provider] = createSmart(CounterSmart);
  return (
    <Provider>
      <CounterComponent />
    </Provider>
  );
};

test("CounterComponent increments and decrements", () => {
  const { getByText, getByTestId } = render(<Wrapper />);

  const countText = getByTestId("count");
  const incrementButton = getByText("Increment");
  const decrementButton = getByText("Decrement");

  expect(countText).toHaveTextContent("Count: 0");

  fireEvent.click(incrementButton);
  expect(countText).toHaveTextContent("Count: 1");

  fireEvent.click(decrementButton);
  expect(countText).toHaveTextContent("Count: 0");
});
```

### Jest Configuration

Ensure your Jest configuration is set up to handle React and TypeScript:

```javascript
// jest.config.js
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
};
```

```typescript
// jest.setup.ts
import "@testing-library/jest-dom";
```

### TypeScript Configuration

Update your `tsconfig.json` to include the necessary types:

```json
{
  "compilerOptions": {
    "target": "ES6",
    "module": "commonjs",
    "jsx": "react",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "types": ["jest", "@testing-library/jest-dom"],
    "skipLibCheck": true
  },
  "exclude": ["node_modules", "**/*.test.tsx"]
}
```

## API Reference

### Smart Class

The `Smart` class is the core of the library, providing state management and subscriber notifications.

#### **Class: Smart**

```typescript
abstract class Smart<StateModel = any, Config = any> {
  public state: StateModel;
  public config: Config;

  constructor(config?: Config);

  async init(): Promise<void>;

  async destroy(): Promise<void>;

  setState(newState: StateModel, options?: SetStateOptions): void;

  updateState(update: Partial<StateModel>, options?: SetStateOptions): void;

  subscribe(subscriber: SmartSubscriber<StateModel>): void;

  unsubscribe(subscriber: SmartSubscriber<StateModel>): void;

  static getContext<T extends Smart>(): React.Context<T>;

  getSubscriberCount(): number; // For testing purposes
}
```

#### **Types**

- **SmartSubscriber**

  ```typescript
  type SmartSubscriber<StateModel> = (
    oldState: StateModel | undefined,
    newState: StateModel
  ) => void;
  ```

- **SetStateOptions**

  ```typescript
  type SetStateOptions = {
    silent?: boolean;
  };
  ```

### Hooks and HOCs

#### **useSmart Hook**

Allows components to access the Smart model from context and re-render on state changes.

```typescript
function useSmart<T extends Smart>(modelClass: {
  getContext(): React.Context<T>;
}): T;
```

#### **newSmart Hook**

Initializes the Smart model and provides a Provider component.

```typescript
function newSmart<T extends Smart>(modelClass: {
  new (): T;
  getContext(): React.Context<T>;
}): [T, FC];
```

#### **withSmart HOC**

Wraps a component with the Smart Provider.

```typescript
function withSmart<T extends Smart>(modelClass: {
  new (): T;
  getContext(): React.Context<T>;
}): <P extends object>(Component: React.ComponentType<P>) => FC<P>;
```

## Examples

### Simple Counter Example

**CounterSmart.tsx**

```typescript
import React, { createContext } from "react";
import { Smart } from "@bluelibs/smart";

type CounterState = {
  count: number;
};

export class CounterSmart extends Smart<CounterState> {
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

  static context = createContext<CounterSmart>(null as any);

  static getContext() {
    return this.context;
  }
}
```

**CounterComponent.tsx**

```tsx
import React from "react";
import { useSmart } from "@bluelibs/smart";
import { CounterSmart } from "./CounterSmart";

const CounterComponent: React.FC = () => {
  const counter = useSmart(CounterSmart);

  return (
    <div>
      <p>Count: {counter.state.count}</p>
      <button onClick={() => counter.increment()}>Increment</button>
      <button onClick={() => counter.decrement()}>Decrement</button>
    </div>
  );
};

export default CounterComponent;
```

**App.tsx**

```tsx
import React from "react";
import { createSmart } from "@bluelibs/smart";
import { CounterSmart } from "./CounterSmart";
import CounterComponent from "./CounterComponent";

const App: React.FC = () => {
  const [counterModel, CounterProvider] = createSmart(CounterSmart);

  return (
    <CounterProvider>
      <h1>Smart Counter</h1>
      <CounterComponent />
    </CounterProvider>
  );
};

export default App;
```

### Higher-Order Component Example

**EnhancedCounter.tsx**

```tsx
import React from "react";
import { withSmart } from "@bluelibs/smart";
import { CounterSmart } from "./CounterSmart";

interface EnhancedCounterProps {
  label: string;
}

const EnhancedCounter: React.FC<EnhancedCounterProps> = ({ label }) => {
  const counter = useSmart(CounterSmart);

  return (
    <div>
      <h2>{label}</h2>
      <p>Count: {counter.state.count}</p>
      <button onClick={() => counter.increment()}>Increment</button>
      <button onClick={() => counter.decrement()}>Decrement</button>
    </div>
  );
};

export default withSmart(CounterSmart)(EnhancedCounter);
```

**App.tsx**

```tsx
import React from "react";
import EnhancedCounter from "./EnhancedCounter";

const App: React.FC = () => {
  return (
    <div>
      <h1>Smart Counter with HOC</h1>
      <EnhancedCounter label="My Counter" />
    </div>
  );
};

export default App;
```

## Contributing

Contributions are welcome! Whether it's bug fixes, new features, or improving documentation, your input is valuable. To contribute:

1. Fork the repository.
2. Create a new branch for your feature or bugfix.
3. Commit your changes with clear messages.
4. Submit a pull request describing your changes.

Please ensure your code adheres to the project's coding standards and includes relevant tests.

## License

[MIT](LICENSE)
