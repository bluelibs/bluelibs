import "../styles/globals.css";
import type { AppProps } from "next/app";
import { XUIProvider } from "@bluelibs/x-ui-react-bundle";
import { kernel } from "../startup/kernel";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <XUIProvider kernel={kernel}>
      <Component {...pageProps} />
    </XUIProvider>
  );
}

export default MyApp;
