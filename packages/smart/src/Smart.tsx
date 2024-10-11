import * as React from "react";
import { FC, useContext, useEffect, useMemo, useRef, useState } from "react";

type SmartSubscriber<StateModel> = (
  oldState: StateModel | undefined,
  newState: StateModel
) => void;

export type SetStateOptions = {
  silent?: boolean;
};

export abstract class Smart<StateModel = any, Config = null> {
  public state!: StateModel;
  public config!: Config;
  protected subscribers: SmartSubscriber<any>[] = [];
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

  static getContext<T extends Smart>(): React.Context<any> {
    throw new Error(
      "Please implement static getContext() in your Smart subclass."
    );
  }

  // For testing purposes: expose subscribers length
  getSubscriberCount(): number {
    return this.subscribers.length;
  }
}

// Custom Hook to use Smart model
export function useSmart<T extends Smart<any, any>>(modelClass: {
  getContext(): React.Context<T>;
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
    const subscriber: SmartSubscriber<any> = () => {
      forceUpdate((n) => n + 1);
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
 * @param args
 */
export function newSmart(...args: never[]) {}

// Custom Hook to create Smart model and Provider
export function useNewSmart<T extends Smart<any, any>>(
  modelClass: {
    new (): T;
    getContext(): React.Context<T>;
  },
  ...args: T extends Smart<infer S, infer C> ? (C extends null ? [] : [C]) : []
): [T, FC<{ children: any }>] {
  const model = useMemo(() => {
    const instance = new modelClass();
    instance.setConfig(args[0] as any);
    instance.init();

    return instance;
  }, [modelClass, args[0]]);

  const Provider: FC<{ children: any }> = ({ children }) => {
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
export function withSmart<T extends Smart<S, C>, S, C>(
  modelClass: {
    new (): T;
    getContext(): React.Context<T>;
  },
  ...args: T extends Smart<infer S, infer C> ? (C extends null ? [] : [C]) : []
) {
  return function <P extends object>(Component: React.ComponentType<P>): FC<P> {
    return function SmartComponent(props: P) {
      const [model, Provider] = useNewSmart(modelClass, ...args);
      return (
        <Provider>
          <Component {...props} />
        </Provider>
      );
    };
  };
}
