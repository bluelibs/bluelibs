import * as React from "react";
import { useContext, useEffect, useState, useMemo } from "react";
import { Smart } from "./Smart";

const SmartOptionsDefaults: INewSmartOptions = {
  isolated: false,
};

export function setDefaults(defaults: INewSmartOptions) {
  Object.assign(SmartOptionsDefaults, defaults);
}

type Constructor<T> = { new (...args: any[]): T };
type SmartConstructor<S, U> = { new (...args: any[]): Smart<S, U> };

export interface INewSmartOptions {
  factory?<S, U>(targetType: SmartConstructor<S, U>, config: U): Smart<S, U>;
  /**
   * Isolated means that it will not react to state changes.
   */
  isolated?: boolean;
}

export const newSmart = <S, U, T extends Smart<S, U>>(
  targetType: Constructor<T & Smart<S, U>>,
  config?: U,
  options?: INewSmartOptions
): [T, React.ComponentType<any>] => {
  options = Object.assign({}, options, SmartOptionsDefaults);

  // We are using memo values here to avoid redoing this on every rerender
  const model = useMemo(() => {
    return createSmartModel<S, U, T>(options, targetType, config);
  }, []);

  const Provider = useMemo(() => {
    return ({ children }) => {
      return React.createElement((targetType as any).getContext().Provider, {
        value: model,
        children,
      });
    };
  }, []);

  // Ensure we are looking at the propper states.
  if (options.isolated) {
    // Don't react to state changes
  } else {
    reactToSmartStateChange(model);
  }
  useEffect(() => {
    model.init();

    return function cleanup() {
      model.destroy();
    };
  }, []);

  return [model, Provider];
};

type Returnable<T> = (...args: any[]) => T;

function createSmartModel<S, U, T extends Smart<S, U>>(
  options: INewSmartOptions,
  targetType: Constructor<T & Smart<S, U>>,
  config: U
) {
  let model;
  if (options?.factory) {
    model = options.factory(targetType, config);
  } else {
    model = new targetType();
  }
  model.setConfig(config);

  return model;
}

/**
 * Smart creates a wrapper function which accepts a Component as argument
 * @param targetType
 * @param config
 * @param options
 */
export function smart<T extends Smart<S, U>, S, U>(
  targetType: new () => T,
  config?: U,
  options?: INewSmartOptions
): Returnable<React.ComponentType<any>> {
  return function (Component) {
    const Container = function (props) {
      const [api, Provider] = newSmart(targetType, config, options);

      return React.createElement(Provider, {
        children: React.createElement(Component, props),
      });
    };

    Container.displayName = `SmartComponent(${getDisplayName(Component)})`;

    return Container;
  };
}

export type UseSmartOptions = {
  /**
   * This option is used when you only want to use the api and not react on state changes.
   */
  isolated?: boolean;
};

export const useSmart = <T extends Smart>(
  modelClass: {
    new (...args: any[]): T;
  },
  options?: UseSmartOptions
): T => {
  const model = useContext<T>((modelClass as any).getContext());

  if (options?.isolated) {
    // If it's isolated it will not react (re-render) when the state changes.
  } else {
    reactToSmartStateChange(model);
  }

  return model;
};

function reactToSmartStateChange(model) {
  const [, updateState] = React.useState({});
  const forceUpdate = React.useCallback(() => updateState({}), []);

  useMemo(() => {
    // If we put this in useEffect it won't work initially as useEffect can be run async later
    model.subscribe(forceUpdate);
    return null;
  }, []);

  useEffect(() => {
    return () => {
      model.unsubscribe(forceUpdate);
    };
  }, []);
}

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || "Component";
}
