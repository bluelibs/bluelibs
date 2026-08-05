import * as React from "react";
import * as Components from "./index";

export interface IComponents<
  // why: DeepPartial<ComponentType<ConcreteProps>> (used by Bundle.defaultConfig) recurses into React propTypes and cannot compile; any keeps them usable
  Error = any,
  NOT_AUTHORIZED = any,
> {
  Error: React.ComponentType<Error>;
  ErrorBoundary: React.ComponentType<{ children?: React.ReactNode }>;
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
