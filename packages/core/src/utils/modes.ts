export enum ExecutionContext {
  WEB = "web",
  REACT_NATIVE = "react-native",
  SERVER = "server",
}

export function getExecutionContext(): ExecutionContext {
  // @ts-expect-error
  if (typeof document != "undefined") {
    return ExecutionContext.WEB;
  } else if (
    // @ts-expect-error
    typeof navigator != "undefined" &&
    // @ts-expect-error
    navigator.product == "ReactNative"
  ) {
    return ExecutionContext.REACT_NATIVE;
  } else {
    return ExecutionContext.SERVER;
  }
}
