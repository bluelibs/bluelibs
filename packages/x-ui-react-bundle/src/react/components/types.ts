import * as React from "react";
import * as Components from "./index";

export interface IComponents<Error = any, NOT_AUTHORIZED = any> {
  Error: React.ComponentType<Error>;
  ErrorBoundary: React.ComponentType;
  Loading: React.ComponentType;
  NotAuthorized: React.ComponentType<NOT_AUTHORIZED>;
  NotFound: React.ComponentType;
}

export const DefaultComponents: IComponents = {
  ErrorBoundary: Components.ErrorBoundary,
  Error: Components.Error,
  Loading: Components.Loading,
  NotAuthorized: Components.NotAuthorized,
  NotFound: Components.NotFound,
};
