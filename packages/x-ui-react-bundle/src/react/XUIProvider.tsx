import * as React from "react";
import { createContext, useEffect, useMemo, useState } from "react";
import { Kernel, ContainerInstance } from "@bluelibs/core";
import { listen, useContainer } from "./hooks";
import { useUIComponents } from "./hooks/useUIComponents";
import { LocaleChangedEvent } from "./events/LocaleChangedEvent";
import { XUIReactBundle } from "..";
import { ChildrenContext, generateWrapperTree } from "./utils";
import { Components } from ".";

export const ContainerContext = createContext<ContainerInstance | null>(null);
ContainerContext.displayName = "BlueLibsContainer";

export interface IXUIProviderProps {
  kernel: Kernel;
  loadingComponent?: JSX.Element;
  children?: React.ReactNode;
}

type IChildrenProviderProps = {
  finalChildren: React.ReactNode;
  children?: React.ReactNode;
};

type ChildrenState = {
  children: React.ReactNode;
  setChildren: (children: React.ReactNode) => void;
};

export const XUIProvider = (props: IXUIProviderProps) => {
  const { kernel, children, loadingComponent } = props;

  const [isInitialized, setIsInitialized] = useState(kernel.isInitialised());

  useEffect(() => {
    if (isInitialized) return;

    kernel
      .init()
      .then(() => {
        setIsInitialized(true);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  if (!isInitialized) {
    return loadingComponent ?? <Components.Loading />;
  }

  return (
    <ContainerContext.Provider value={kernel.container}>
      <ChildrenProvider finalChildren={children}>
        <XUIProviderInitialised />
      </ChildrenProvider>
    </ContainerContext.Provider>
  );
};

/**
 * The component that is rendered once the Kernel has been initialised
 * @returns
 */
const XUIProviderInitialised: React.FC = () => {
  const UIComponents = useUIComponents();

  const container = useContainer();

  // We do this to trigger re-rendering
  const [_, setLocale] = useState<string>();
  const handler = useMemo(
    () => (e: LocaleChangedEvent) => setLocale(e.data.locale),
    []
  );

  listen(LocaleChangedEvent, handler);

  const WrapperComponents = useMemo(() => {
    if (!container) {
      return null;
    }
    return generateWrapperTree(container.get(XUIReactBundle).wrappers);
  }, [container]);

  return (
    <UIComponents.ErrorBoundary>{WrapperComponents}</UIComponents.ErrorBoundary>
  );
};

export const ChildrenProvider: React.FC<IChildrenProviderProps> = (props) => {
  const [childrenState, setChildrenState] = useState<React.ReactNode>(null);

  const setChildren = useMemo(() => {
    return (children: React.ReactNode) => {
      setChildrenState(children);
    };
  }, []);

  useEffect(() => {
    setChildrenState(props.finalChildren);
  }, [props.finalChildren]);

  const contextValue: ChildrenState = {
    children: childrenState,
    setChildren,
  };

  return (
    <ChildrenContext.Provider value={contextValue}>
      {props.children}
    </ChildrenContext.Provider>
  );
};
