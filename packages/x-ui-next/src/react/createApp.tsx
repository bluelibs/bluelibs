import * as React from "react";
import type { AppProps } from "next/app";
import { useMemo } from "react";
import { CreateAppProps } from "../defs";
import { XUIProvider } from "@bluelibs/x-ui-react-bundle";

export const createApp = (props: CreateAppProps) => {
  const { loadingComponent, kernel: baseKernel } = props;

  const App = ({ Component, pageProps }: AppProps) => {
    const kernel = useMemo(() => baseKernel, []);

    return (
      <XUIProvider {...{ kernel, loadingComponent }}>
        <Component {...pageProps} />
      </XUIProvider>
    );
  };

  return App;
};
