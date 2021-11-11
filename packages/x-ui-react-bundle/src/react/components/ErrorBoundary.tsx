import * as React from "react";
import { ContainerContext } from "../XUIProvider";
import { ContainerInstance } from "@bluelibs/core";
import { Error } from "./Error";

export type ErrorBoundaryProps = {
  children: React.ReactNode;
};

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  {
    hasError: boolean;
    errorMessage: string;
  },
  ContainerInstance
> {
  context: ContainerInstance;
  currentError: Error;
  currentErrorInfo: React.ErrorInfo;

  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: "",
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, errorMessage: error.toString() };
  }

  componentDidCatch(error, errorInfo) {
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
