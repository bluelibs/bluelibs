export enum ExecutionContext {
  WEB = "web",
  REACT_NATIVE = "react-native",
  SERVER = "server",
}

export function getExecutionContext(): ExecutionContext {
  if (typeof document != "undefined") {
    return ExecutionContext.WEB;
  } else if (
    typeof navigator != "undefined" &&
    navigator.product == "ReactNative"
  ) {
    return ExecutionContext.REACT_NATIVE;
  } else {
    return ExecutionContext.SERVER;
  }
}
