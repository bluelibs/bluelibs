import Observable from "zen-observable";
import { EJSON } from "@bluelibs/ejson";
import {
  IEventsMap,
  ISubscriptionEventMessage,
  SubscriptionEvents,
} from "../defs";

/**
 * Documents parsed from the subscription wire format are guaranteed to carry
 * an `_id` (mutation handling matches on it), even though the consumer's
 * model type (`T`) does not declare one.
 */
type DocumentWithId = { _id: { toString(): string } };

export class XSubscription<T> {
  protected isReady = false;
  protected dataSet: T[] = [];
  protected subscriptionHandler: Observable.Subscription;

  constructor(
    public readonly observable: Observable<{ data?: Record<string, unknown> }>,
    protected readonly reactStateSetter: (
      dataSet: T[] | ((prev: T[]) => T[])
    ) => void,
    protected readonly eventsMap: IEventsMap
  ) {
    this.subscriptionHandler = observable.subscribe({
      error(err) {
        eventsMap.onError && eventsMap.onError(err);
      },
      next: (value: { data?: Record<string, unknown> }) => {
        if (value?.data) {
          const message = Object.values(
            value.data
          )[0] as ISubscriptionEventMessage;

          if (message.event === SubscriptionEvents.READY) {
            this.isReady = true;
            if (this.eventsMap.onReady) {
              this.updateReactState();
              this.eventsMap.onReady();
            }
          } else {
            this.processMutation(message);
          }
        }
      },
    });
  }

  processMutation(message: ISubscriptionEventMessage) {
    const document: T & DocumentWithId =
      typeof message.document === "string"
        ? (EJSON.parse(message.document) as T & DocumentWithId)
        : (message.document as T & DocumentWithId);

    if (message.event === SubscriptionEvents.ADDED) {
      this.dataSet = [...this.dataSet, document];

      if (this.eventsMap.onAdded) {
        this.eventsMap.onAdded(document);
      }
      if (this.isReady) {
        this.updateReactState();
      }
    }
    if (message.event === SubscriptionEvents.CHANGED) {
      const { _id, ...changeSet } = document;
      let oldDocument = {};

      this.dataSet = this.dataSet.map((currentDoc) => {
        if (this.idOf(currentDoc).toString() === _id.toString()) {
          oldDocument = Object.assign({}, currentDoc);
          return Object.assign({}, currentDoc, changeSet);
        }

        return currentDoc;
      });

      this.updateReactState();
      if (this.eventsMap.onChanged) {
        this.eventsMap.onChanged(document, changeSet, oldDocument);
      }
    }
    if (message.event === SubscriptionEvents.REMOVED) {
      let foundDocument: T | undefined;
      this.dataSet = this.dataSet.filter((doc) => {
        const isFound = this.idOf(doc).toString() === document._id.toString();
        if (isFound) {
          foundDocument = doc;
        }
        return !isFound;
      });
      this.updateReactState();
      if (this.eventsMap.onRemoved) {
        this.eventsMap.onRemoved(foundDocument);
      }
    }
  }

  protected idOf(document: T): { toString(): string } {
    return (document as T & DocumentWithId)._id;
  }

  updateReactState() {
    this.reactStateSetter(this.dataSet);
  }

  stop() {
    this.subscriptionHandler.unsubscribe();
  }
}
