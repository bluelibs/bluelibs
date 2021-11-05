import * as React from "react";
import { createContext, useContext } from "react";
import { useEffect, useMemo, useState } from "react";
import { Kernel, ContainerInstance } from "@bluelibs/core";
import { listen, useContainer } from "./hooks";
import { useUIComponents } from "./hooks/useUIComponents";
import { LocaleChangedEvent } from "./events/LocaleChangedEvent";
import { XUIReactBundle } from "..";
import { ChildrenContext, generateWrapperTree } from "./utils";
import { Components } from ".";

export const ContainerContext = createContext<ContainerInstance>(null);
ContainerContext.displayName = "BlueLibsContainer";

export interface IXUIProviderProps {
  kernel: Kernel;
  loadingComponent?: JSX.Element;
  children?: any;
}

type IChildrenProviderProps = {
  finalChildren: JSX.Element;
};

export const XUIProvider = (props: IXUIProviderProps) => {
  const { kernel, children, loadingComponent } = props;

<<<<<<< HEAD
  const [isInitialized, setIsInitialized] = useState(kernel.isInitialised());
=======
  const [isInitialized, setIsInitialized] = useState(kernel.isInitialized());
>>>>>>> 047d18a ((initial changes))

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
  const handler = useMemo(() => (e: any) => setLocale(e.data.locale), []);

  listen(LocaleChangedEvent, handler);

  const WrapperComponents = useMemo(
    () => generateWrapperTree(container.get(XUIReactBundle).wrappers),
    []
  );

  return (
    <UIComponents.ErrorBoundary>{WrapperComponents}</UIComponents.ErrorBoundary>
  );
};

export const ChildrenProvider: React.FC<IChildrenProviderProps> = (props) => {
  const [children, setChildren] = useState(null);

  useEffect(() => {
    setChildren(props.finalChildren);
  }, [props.finalChildren]);

  return (
    <ChildrenContext.Provider value={{ setChildren, children }}>
      {props.children}
    </ChildrenContext.Provider>
  );
};
