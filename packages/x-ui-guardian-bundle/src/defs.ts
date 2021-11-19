import "@bluelibs/x-ui-react-bundle";

import { Constructor } from "@bluelibs/core";
import { GuardianSmart, ProtectProps } from ".";

export type IXUIGuardianBundleConfigType = {
  guardianClass: Constructor<GuardianSmart>;
  /**
   * Provide this component if you want to prevent rendering until Guardian has been initialised.
   * Most likely this is used when your application renders very differently for a logged-in person vs non-logged-in
   */
  loadingComponent?: React.ComponentType;
};

export type IXUIGuardianProviderProps = {
  /**
   * Provide this component
   */
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
