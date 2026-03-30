import * as React from "react";
import { ContainerContext } from "../XUIProvider";
import { ContainerInstance } from "@bluelibs/core";
import { Error } from "./Error";

export type ErrorBoundaryProps = {
  children?: React.ReactNode;
};

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  {
    hasError: boolean;
    errorMessage: string;
  },
  ContainerInstance
> {
  declare context: ContainerInstance;
  currentError: Error | null = null;
  currentErrorInfo: React.ErrorInfo | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: "",
    };
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, errorMessage: error.toString() };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.currentError = error;
    this.currentErrorInfo = errorInfo;
    // You can also log the error to an error reporting service
    console.error(`ErrorBoundary caught error: `, error);
  }

  render() {
    if (this.state.hasError) {
      return <Error error={this.state.errorMessage} />;
    }

    return this.props.children;
  }
}

ErrorBoundary.contextType = ContainerContext;
