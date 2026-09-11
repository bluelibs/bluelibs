import * as React from "react";
import { FC, useContext, useEffect, useMemo, useState } from "react";

type SmartSubscriber<StateModel> = (
  oldState: StateModel | undefined,
  newState: StateModel
) => void;

export type SetStateOptions = {
  silent?: boolean;
};

export abstract class Smart<StateModel = unknown, Config = null> {
  public state!: StateModel;
  public config!: Config;
  // why: React.Context is invariant and this static holds the context of every Smart subclass
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static _context: React.Context<any> | null = null;

  protected subscribers: SmartSubscriber<StateModel>[] = [];
  protected previousState?: StateModel;

  setConfig(config: Config) {
    this.config = config;
  }

  async init(): Promise<void> {}

  async destroy(): Promise<void> {}

  setState(newState: StateModel, options?: SetStateOptions) {
    this.previousState = this.state;
    this.state = newState;

    if (!options?.silent) {
      this.inform();
    }
  }

  updateState(update: Partial<StateModel>, options?: SetStateOptions) {
    this.setState({ ...this.state, ...update } as StateModel, options);
  }

  protected inform() {
    this.subscribers.forEach((subscriber) => {
      subscriber(this.previousState, this.state);
    });
  }

  subscribe(subscriber: SmartSubscriber<StateModel>) {
    if (!this.subscribers.includes(subscriber)) {
      this.subscribers.push(subscriber);
    }
  }

  unsubscribe(subscriber: SmartSubscriber<StateModel>) {
    this.subscribers = this.subscribers.filter((s) => s !== subscriber);
  }

  // Automatically create context when needed
  // why: React.Context is invariant and the static-side of subclasses overrides getContext(); `any` is required
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static getContext<T extends Smart<any>>(): React.Context<any> {
    if (!this._context) {
      this._context = React.createContext(null);
    }
    return this._context as React.Context<T>;
  }

  // For testing purposes: expose subscribers length
  getSubscriberCount(): number {
    return this.subscribers.length;
  }
}

// Custom Hook to use Smart model
// why: the constraint needs `any` because Smart is contravariant in its state through setState()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useSmart<T extends Smart<any, any>>(modelClass: {
  new (): T;
  // why: the concrete smart's static getContext() returns Context<any>; typing it precisely breaks inference
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getContext(): React.Context<any>;
}): T {
  const Context = modelClass.getContext();
  const model = useContext(Context);

  if (!model) {
    throw new Error(
      `No context found for ${modelClass.constructor.name}. Ensure your component is wrapped with the appropriate Provider.`
    );
  }

  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const subscriber: SmartSubscriber<unknown> = () => {
      forceUpdate((n: number) => n + 1);
    };
    model.subscribe(subscriber);
    return () => {
      model.unsubscribe(subscriber);
    };
  }, [model]);

  return model;
}

/**
 * @deprecated use useNewSmart() instead.
 * @param _args
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function newSmart(..._args: never[]) {}

// Custom Hook to create Smart model and Provider
// why: the constraint needs `any` because Smart is contravariant in its state through setState()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useNewSmart<T extends Smart<any, any>>(
  modelClass: {
    new (): T;
    getContext(): React.Context<T>;
  },
  ...args: T extends Smart<infer _S, infer C> ? (C extends null ? [] : [C]) : []
): [T, FC<{ children: React.ReactNode }>] {
  const model = useMemo(() => {
    const instance = new modelClass();
    instance.setConfig(args[0]!);
    instance.init();

    return instance;
  }, [modelClass, args[0]]);

  const Provider: FC<{ children: React.ReactNode }> = ({ children }) => {
    const Context = modelClass.getContext();
    return <Context.Provider value={model}>{children}</Context.Provider>;
  };

  useEffect(() => {
    return () => {
      model.destroy();
    };
  }, [model]);

  return [model, Provider];
}

// Higher-Order Component to wrap components with Smart Provider
// why: the constraint needs `any` because Smart is contravariant in its state through setState()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withSmart<T extends Smart<any, any>>(
  modelClass: {
    new (): T;
    getContext(): React.Context<T>;
  },
  ...args: T extends Smart<infer _S, infer C> ? (C extends null ? [] : [C]) : []
) {
  return function <P extends object>(Component: React.ComponentType<P>): FC<P> {
    return function SmartComponent(props: P) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_model, Provider] = useNewSmart(modelClass, ...args);
      return (
        <Provider>
          <Component {...props} />
        </Provider>
      );
    };
  };
}
