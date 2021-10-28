import Observable from "zen-observable";
import { EJSON } from "@bluelibs/ejson";
import {
  IEventsMap,
  ISubscriptionEventMessage,
  SubscriptionEvents,
} from "../defs";

export class XSubscription<T extends { _id: any }> {
  protected isReady = false;
  protected dataSet: T[] = [];
  protected subscriptionHandler: ZenObservable.Subscription;

  constructor(
    public readonly observable: Observable<any>,
    protected readonly reactStateSetter: any,
    protected readonly eventsMap: IEventsMap
  ) {
    this.subscriptionHandler = observable.subscribe({
      error(err) {
        eventsMap.onError && eventsMap.onError(err);
      },
      next: (value: any) => {
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
    const document: T =
      typeof message.document === "string"
        ? (EJSON.parse(message.document) as T)
        : (message.document as T);

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
        if (currentDoc._id.toString() === _id.toString()) {
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
      let foundDocument;
      this.dataSet = this.dataSet.filter((doc) => {
        const isFound = doc._id.toString() === document._id.toString();
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

  updateReactState() {
    this.reactStateSetter(this.dataSet);
  }

  stop() {
    this.subscriptionHandler.unsubscribe();
  }
}
