export enum ExecutionContext {
  WEB = "web",
  REACT_NATIVE = "react-native",
  SERVER = "server",
}

export function getExecutionContext(): ExecutionContext {
  // @ts-ignore - document may not exist in non-browser environments
  if (typeof document != "undefined") {
    return ExecutionContext.WEB;
  } else if (
    // @ts-ignore - navigator may not exist in non-browser environments
    typeof navigator != "undefined" &&
    // @ts-ignore - navigator.product may not exist
    navigator.product == "ReactNative"
  ) {
    return ExecutionContext.REACT_NATIVE;
  } else {
    return ExecutionContext.SERVER;
  }
}
