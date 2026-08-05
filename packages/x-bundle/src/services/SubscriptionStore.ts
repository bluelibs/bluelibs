import { Inject, Service } from "@bluelibs/core";
import { Collection } from "@bluelibs/mongo-bundle";
import { QueryBodyType } from "@bluelibs/nova";
import { Filter } from "mongodb";
import { PubSub } from "graphql-subscriptions";
import { EventEmitter } from "events";
import { v4 as uuid } from "uuid";
import {
  MESSENGER,
  GraphQLSubscriptionEvent,
  IS_LIVE_DEBUG,
} from "../constants";
import { IDocumentBase, IMessenger, ISubscriptionEventOptions } from "../defs";
import { SubscriptionHandler } from "../models/SubscriptionHandler";
import {
  SubscriptionProcessor,
  SubscriptionProcessorOptionsType,
} from "../models/SubscriptionProcessor";
import { LIVE_BEHAVIOR_MARKER } from "../behaviors/live.behavior";

@Service()
export class SubscriptionStore {
  // why: the store holds processors/handlers for heterogeneous document types,
  // a single generic cannot represent all of them
  public processors: SubscriptionProcessor<any>[] = [];

  protected pubSubEventEmitter: EventEmitter;
  protected pubSub: PubSub;
  protected pubSubChannelStore: {
    [uuid: string]: SubscriptionHandler<any>;
  } = {};

  constructor(
    @Inject(IS_LIVE_DEBUG)
    protected readonly isDebug: boolean,
    @Inject(MESSENGER)
    protected readonly messenger: IMessenger
  ) {
    this.pubSubEventEmitter = new EventEmitter();
    this.pubSub = new PubSub({
      eventEmitter: this.pubSubEventEmitter,
    });
  }

  /**
   * This is designed to customly work with GraphQL
   * @param collection
   * @param body
   */
  async createAsyncIterator<T extends IDocumentBase>(
    collection: Collection<T>,
    body: QueryBodyType<T>,
    subscriptionOptions: SubscriptionProcessorOptionsType = {}
  ): Promise<AsyncIterator<unknown>> {
    const channel = uuid();

    const publish = (event: GraphQLSubscriptionEvent, document?: unknown) => {
      this.isDebug &&
        console.log(
          `[publish] channel: "${channel}", event: "${event}"`,
          document ?? null
        );
      this.pubSub.publish(channel, { document, event });
    };

    return new Promise(async (resolve) => {
      resolve(this.pubSub.asyncIterator([channel]));

      // We have to wait on the resolve to execute
      // Because if this happens too fast
      process.nextTick(async () => {
        const handler = await this.createSubscription(
          collection,
          body,
          {
            onAdded: (document: T) => {
              publish(GraphQLSubscriptionEvent.ADDED, document);
            },
            onChanged: (document: T, changeSet: Partial<T>) => {
              publish(GraphQLSubscriptionEvent.CHANGED, {
                _id: document._id,
                ...changeSet,
              });
            },
            onRemoved: (document: T) => {
              publish(GraphQLSubscriptionEvent.REMOVED, {
                _id: document._id,
              });
            },
          },
          subscriptionOptions
        );

        publish(GraphQLSubscriptionEvent.READY, {});

        this.pubSubChannelStore[channel] = handler;
        this.handleAsyncIteratorStopping(channel, handler);

        this.isDebug &&
          console.log(`[publish] async iterator ready for channel ${channel}`);
      });
    });
  }

  /**
   * This is designed to work with GraphQL for counting
   * @param collection
   * @param filters
   */
  async createAsyncIteratorForCounting<T extends IDocumentBase>(
    collection: Collection<T>,
    filters: Filter<T> = {},
    subscriptionOptions: SubscriptionProcessorOptionsType = {}
  ): Promise<AsyncIterator<unknown>> {
    const channel = uuid();

    const publish = (count: number) => {
      this.pubSub.publish(channel, { count });
    };

    return new Promise(async (resolve) => {
      resolve(this.pubSub.asyncIterator([channel]));

      let ready = false;
      const handler = await this.createSubscription(
        collection,
        {
          $: { filters },
          _id: 1,
        } as unknown as QueryBodyType<T>,
        {
          onAdded: () => {
            ready && publish(handler.documentStore.length);
          },
          onRemoved: () => {
            ready && publish(handler.documentStore.length);
          },
        },
        subscriptionOptions
      );
      ready = true;
      publish(handler.documentStore.length);

      this.pubSubChannelStore[channel] = handler;
      this.handleAsyncIteratorStopping(channel, handler);
    });
  }

  async createSubscription<T extends IDocumentBase>(
    collection: Collection<T>,
    body: QueryBodyType<T>,
    eventOptions: ISubscriptionEventOptions = {},
    subscriptionOptions: SubscriptionProcessorOptionsType = {}
  ): Promise<SubscriptionHandler<T>> {
    if (!collection[LIVE_BEHAVIOR_MARKER]) {
      console.warn(
        `This collection: "${collection.collectionName}" does not have the live behavior attached. Reactivity may not work as expected.`
      );
    }
    if (!body) {
      body = {} as QueryBodyType<T>;
    }
    this.cleanupBody(body);

    const id = SubscriptionStore.getSubscriptionId(
      collection,
      body,
      subscriptionOptions
    );

    let foundProcessor = this.processors.find(
      (processor) => processor.id == id
    );

    // if it doesn't exist, we create the processor
    if (!foundProcessor) {
      foundProcessor = this.createProcessor(
        collection,
        body,
        subscriptionOptions
      );
      await foundProcessor.start();
    } else {
      this.isDebug &&
        console.log(
          `[${collection.collectionName}] Re-using processor with id: ${foundProcessor.id}`
        );
    }

    // we create the handle, and we push it to this processor
    const subscriptionHandler = new SubscriptionHandler(foundProcessor, this);
    this.attachEventsToHandlerFromOptions<T>(eventOptions, subscriptionHandler);

    foundProcessor.attachHandler(subscriptionHandler);

    return subscriptionHandler;
  }

  /**
   * This makes sure that later we don't have to deal with existence checks
   * And make sure we include _id otherwise, we can't know what to update
   * @param body
   */
  private cleanupBody<T extends IDocumentBase>(body: QueryBodyType<T>) {
    if (!body.$) {
      body.$ = {};
    }
    body.$ = Object.assign(
      {
        filters: {},
        options: {},
      },
      body.$
    );
    if (!body._id) {
      body._id = 1;
    }
  }

  /**
   * This creates the handle of removing
   * @param channel
   */
  protected handleAsyncIteratorStopping<T extends IDocumentBase>(
    channel: string,
    handler: SubscriptionHandler<T>
  ) {
    const stopObserver = (_channel: string) => {
      if (_channel === channel) {
        if (this.pubSubChannelStore[channel]) {
          this.pubSubChannelStore[channel].stop();
          delete this.pubSubChannelStore[channel];
        }

        this.pubSubEventEmitter.removeListener("removeListener", stopObserver);
        this.stopHandle(handler);
      }
    };

    this.pubSubEventEmitter.on("removeListener", stopObserver);
  }

  /**
   * This method is used to register the events before any document is added
   * @param subscriptionEvents
   * @param subscriptionHandler
   */
  protected attachEventsToHandlerFromOptions<T extends IDocumentBase>(
    subscriptionEvents: ISubscriptionEventOptions = {},
    subscriptionHandler: SubscriptionHandler<T>
  ) {
    ["onAdded", "onChanged", "onRemoved"].forEach((event) => {
      if (subscriptionEvents[event]) {
        if (Array.isArray(subscriptionEvents[event])) {
          subscriptionEvents[event].forEach((handler) => {
            subscriptionHandler[event](handler);
          });
        } else {
          subscriptionHandler[event](subscriptionEvents[event]);
        }
      }
    });
  }

  /**
   *
   * @param handle
   */
  stopHandle<T extends IDocumentBase>(handle: SubscriptionHandler<T>) {
    this.isDebug && console.log(`[handles] Stopping a handle from a processor`);
    handle.processor.detachHandler(handle);
    if (!handle.processor.hasHandlers()) {
      this.stopProcessor(handle.processor);
    }
  }

  createProcessor<T extends IDocumentBase>(
    collection: Collection<T>,
    body: QueryBodyType<T>,
    subscriptionOptions: SubscriptionProcessorOptionsType = {}
  ): SubscriptionProcessor<T> {
    const processor = new SubscriptionProcessor(
      this.messenger,
      this.isDebug,
      collection,
      body,
      subscriptionOptions
    );

    this.processors.push(processor);

    return processor;
  }

  stopProcessor<T extends IDocumentBase>(processor: SubscriptionProcessor<T>) {
    this.isDebug &&
      console.log(
        `[processors] Destroying subscription with id: ${processor.id}`
      );
    processor.stop();
    this.processors = this.processors.filter(
      (_processor) => processor !== _processor
    );
  }

  static getSubscriptionId<T>(
    collection: Collection,
    body: QueryBodyType<T>,
    subscriptionOptions: SubscriptionProcessorOptionsType = {}
  ) {
    // We need to ensure that first level cannot be a function
    let prefix = "";
    if (subscriptionOptions.channels) {
      prefix += subscriptionOptions.channels.join(",") + ":";
    }

    return prefix + collection.collectionName + ":" + JSON.stringify(body);
  }
}

// Responsible of keeping all the subscription processors and their ids
// When a new subscription comes in, we need to check if we can re-use a processor
// When a subscription dies we need to properly ensure that the processor no longer exists
