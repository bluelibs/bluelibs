import { Exception } from "./models/Exception";

export class KernelFrozenException extends Exception {
  getMessage() {
    return `Kernel is frozen. You can no longer perform this action.`;
  }
}

export class BundleSingleInstanceException extends Exception {
  getMessage() {
    return "You must not have multiple instances of the same bundle inside the Kernel";
  }
}

export class BundleFrozenException extends Exception {
  getMessage() {
    return "Bundle is frozen. You cannot perform this action";
  }
}

export class BundleDependencyException extends Exception<{
  requiredBundle: string;
}> {
  getMessage() {
    return `This bundle needs "${this.data.requiredBundle}" to be added to the kernel.`;
  }
}

export class MethodNotImplementedException extends Exception<{
  method: string;
}> {
  getMessage() {
    const { method } = this.data;

    return `Method "${method}" not implemented.`;
  }
}

export class MissingParameterException extends Exception<{
  name: string;
}> {
  getMessage() {
    return `Missing the parameter: "${this.data.name}" from Kernel.`;
  }
}
