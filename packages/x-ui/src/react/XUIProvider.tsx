import * as React from "react";
import { useEffect, useState } from "react";
import { Kernel, ContainerInstance, Constructor } from "@bluelibs/core";
import { XRouter } from "./XRouter";
import { ApolloProvider } from "@apollo/client/react";
import { ApolloClient } from "../graphql/ApolloClient";
import { useContainer } from "./hooks";
import { use } from "./hooks";
import { XBrowserRouter } from "./XBrowserRouter";
import { newSmart } from "./smart";
import { GuardianSmart } from "./smarts/GuardianSmart";
import { XUI_CONFIG_TOKEN } from "../constants";
import { useUIComponents } from "./hooks/useUIComponents";

export const ContainerContext = React.createContext<ContainerInstance>(null);
ContainerContext.displayName = "BlueLibsContainer";

export interface IXUIProviderProps {
  kernel: Kernel;
  loadingComponent?: React.ComponentType<any>;
  children?: any;
}

export function XUIProvider(props: IXUIProviderProps) {
  const { kernel, children } = props;
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
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
    if (props.loadingComponent) {
      return React.createElement(props.loadingComponent);
    } else {
      return null;
    }
  }

  return (
    <ContainerContext.Provider value={kernel.container}>
      <XUIGuardian loadingComponent={props.loadingComponent}>
        <XUIProviderInitialised />
      </XUIGuardian>
    </ContainerContext.Provider>
  );
}

export function XUIGuardian(props: {
  loadingComponent?: React.ComponentType<any>;
  children?: any;
}) {
  const xuiConfig = use(XUI_CONFIG_TOKEN);
  const [guardian, GuardianProvider] = newSmart(xuiConfig.guardianClass);

  if (!guardian.state.initialised) {
    // We want to prevent re-renders at page/route level due to guardian
    // Not doing so, it may imply a re-render almost 4 times on every page load
    return props.loadingComponent
      ? React.createElement(props.loadingComponent)
      : null;
  }

  return <GuardianProvider>{props.children}</GuardianProvider>;
}

export function XUIProviderInitialised() {
  const router = use(XRouter);
  const UIComponents = useUIComponents();
  const graphqlClient = use(ApolloClient);

  return (
    <UIComponents.ErrorBoundary>
      <ApolloProvider client={graphqlClient}>
        <XBrowserRouter router={router} />
      </ApolloProvider>
    </UIComponents.ErrorBoundary>
  );
}
