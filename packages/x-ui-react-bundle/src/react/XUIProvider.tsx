import * as React from "react";
import { createContext } from "react";
import { useEffect, useMemo, useState } from "react";
import { Kernel, ContainerInstance } from "@bluelibs/core";
import { listen, useContainer } from "./hooks";
import { useUIComponents } from "./hooks/useUIComponents";
import { LocaleChangedEvent } from "./events/LocaleChangedEvent";
import { XUIReactBundle } from "..";
import { generateWrapperTree } from "./utils";
import { Components } from ".";

export const ContainerContext = createContext<ContainerInstance>(null);
ContainerContext.displayName = "BlueLibsContainer";

export interface IXUIProviderProps {
  kernel: Kernel;
  loadingComponent?: JSX.Element;
  children?: any;
}

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
      <XUIProviderInitialised children={children} />
    </ContainerContext.Provider>
  );
};

/**
 * The component that is rendered once the Kernel has been initialised
 * @returns
 */
const XUIProviderInitialised: React.FC = (props) => {
  const UIComponents = useUIComponents();

  const container = useContainer();

  // We do this to trigger re-rendering
  const [_, setLocale] = useState<string>();
  const handler = useMemo(() => (e: any) => setLocale(e.data.locale), []);

  listen(LocaleChangedEvent, handler);

  const wrappersWithXUIProviderChildren = useMemo(
    () =>
      container.get(XUIReactBundle).wrappers.concat({
        component: () => props.children as any,
      }),
    []
  );

  const WrapperComponents = useMemo(
    () => generateWrapperTree(wrappersWithXUIProviderChildren),
    []
  );

  return <UIComponents.ErrorBoundary children={WrapperComponents} />;
};
