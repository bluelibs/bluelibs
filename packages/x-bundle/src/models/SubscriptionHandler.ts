import { Collection } from "@bluelibs/mongo-bundle";
import {
  IDocumentBase,
  ISubscriptionHandler,
  OnDocumentAddedHandler,
  OnDocumentChangedHandler,
  OnDocumentRemovedHandler,
} from "../defs";
import { DocumentStore } from "./DocumentStore";
import { SubscriptionProcessor } from "./SubscriptionProcessor";
import { SubscriptionStore } from "../services/SubscriptionStore";

export class SubscriptionHandler<T extends IDocumentBase>
  implements ISubscriptionHandler<T> {
  protected _ready = false;
  protected _readyPromise: Promise<boolean>;
  protected _readyPromiseResolve: Function;

  public readonly addedCallbacks: OnDocumentAddedHandler[] = [];
  public readonly changedCallbacks: OnDocumentChangedHandler<T>[] = [];
  public readonly removedCallbacks: OnDocumentRemovedHandler[] = [];
  public readonly stopCallbacks: Function[] = [];

  constructor(
    public readonly processor: SubscriptionProcessor<T>,
    public readonly subscriptionStore: SubscriptionStore
  ) {
    this._readyPromise = new Promise((resolve) => {
      this._readyPromiseResolve = resolve;
    });
  }

  get collection(): Collection<any> {
    return this.processor.collection;
  }

  get documentStore(): DocumentStore<any> {
    return this.processor.documentStore;
  }

  get count(): number {
    return this.documentStore.length;
  }

  onAdded(handler: OnDocumentAddedHandler) {
    this.addedCallbacks.push(handler);
  }

  onChanged(handler: OnDocumentChangedHandler<T>) {
    this.changedCallbacks.push(handler);
  }

  onRemoved(handler: OnDocumentRemovedHandler) {
    this.removedCallbacks.push(handler);
  }

  onStop(handler: Function) {
    this.stopCallbacks.push(handler);
  }

  public markAsReady() {
    this._ready = true;
    this._readyPromiseResolve();
  }

  /**
   * You can do await
   */
  public async ready(): Promise<boolean> {
    if (this._ready) {
      return true;
    }

    return this._readyPromise;
  }

  public isReady() {
    return this._ready;
  }

  async stop() {
    for (const callback of this.stopCallbacks) {
      await callback();
    }

    this.subscriptionStore.stopHandle(this);
  }
}
