import "@bluelibs/x-ui-react-bundle";

import { Constructor } from "@bluelibs/core";
import { GuardianSmart, ProtectProps } from ".";

export type IXUIGuardianBundleConfigType = {
  guardianClass: Constructor<GuardianSmart>;
};

export type IXUIGuardianProviderProps = {
  loadingComponent?: React.ComponentType;
};

declare module "@bluelibs/x-ui-react-bundle" {
  export interface IComponents<Error = any, NOT_AUTHORIZED = any> {
    Error: React.ComponentType<Error>;
    ErrorBoundary: React.ComponentType;
    Loading: React.ComponentType;
    NotAuthorized: React.ComponentType<NOT_AUTHORIZED>;
    NotFound: React.ComponentType;
    Protect: React.ComponentType<ProtectProps>;
  }
}
