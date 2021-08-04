import * as React from "react";
import * as Components from "./index";

export interface IComponents {
  Error: React.ComponentType<Components.ErrorProps>;
  ErrorBoundary: React.ComponentType;
  Loading: React.ComponentType;
  Protect: React.ComponentType<Components.ProtectProps>;
  NotAuthorized: React.ComponentType<Components.NotAuthorizedProps>;
  NotFound: React.ComponentType;
}

export const DefaultComponents: IComponents = {
  ErrorBoundary: Components.ErrorBoundary,
  Error: Components.Error,
  Loading: Components.Loading,
  Protect: Components.Protect,
  NotAuthorized: Components.NotAuthorized,
  NotFound: Components.NotFound,
};
