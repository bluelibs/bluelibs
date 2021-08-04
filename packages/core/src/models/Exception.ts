const STANDARD_ERROR_MESSAGE = "An error has occured";

export abstract class Exception<T = null> extends Error {
  public readonly data: T;
  public static readonly code: string;

  constructor(...args: T extends null ? [] : [T]) {
    super();
    if (args[0] !== undefined) {
      this.data = args[0];
    }
    this.name = this.constructor.name;
    const code = (this.constructor as typeof Exception).code;
    const prefix = code ? `(${code}) ` : "";
    super.message = prefix + this.getMessage();
  }

  getCode(): string {
    return (this.constructor as typeof Exception).code;
  }

  getMessage(): string {
    return STANDARD_ERROR_MESSAGE;
  }
}
