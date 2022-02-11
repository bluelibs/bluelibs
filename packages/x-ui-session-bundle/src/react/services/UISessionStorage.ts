import {
  EventManager,
  Service,
  Event,
  Inject,
  ExecutionContext,
} from "@bluelibs/core";
import { EJSON } from "@bluelibs/ejson";

/**
 * Execution context-adaptive ui session storage. Works on server and react client.
 */
@Service()
export class UISessionStorage {
  executionContext: ExecutionContext;
  readonly storage: Storage;

  constructor(
    @Inject("%executionContext%") executionContext: ExecutionContext
  ) {
    this.executionContext = executionContext;
    if (this.executionContext === ExecutionContext.WEB) {
      this.storage = localStorage;
    } else if (this.executionContext === ExecutionContext.SERVER) {
      this.storage = new DummyLocalStorage();
    } else {
      throw new Error(
        `The current execution context: ${this.executionContext} is not allowed to be used with UISessions`
      );
    }
  }

  setItem(key: string, value: any) {
    this.storage.setItem(key, value);
  }

  getItem(key: string) {
    const value = this.storage.getItem(key);

    if (typeof value === "string") {
      return EJSON.parse(value);
    }

    return value;
  }

  all() {
    if (this.executionContext === ExecutionContext.WEB) {
      return { ...this.storage };
    } else {
      return (this.storage as DummyLocalStorage).all();
    }
  }
}

class DummyLocalStorage implements Storage {
  length: number;
  store: {
    [key: string]: any;
  } = {};

  clear(): void {
    this.store = {};
  }
  getItem(key: string): string {
    return this.store[key];
  }
  key(index: number): string {
    return this.store[index];
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  setItem(key: string, value: string): void {
    this.store[key] = value;
  }

  all() {
    return this.store;
  }
}
