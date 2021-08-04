import { Inject, Service, EventManager } from "@bluelibs/core";
import { IS_LIVE_DEBUG, REDIS_OPTIONS } from "../constants";
import { ClientOpts, createClient, RedisClient } from "redis";
import { EJSON } from "@bluelibs/ejson";
import { IMessenger, ISubscriptionEvent, MessageHandleType } from "../defs";
import { SubscriptionStore } from "./SubscriptionStore";
import Queue from "queue";
import { RedisConnectionResumedEvent } from "../events/RedisConnectionResumedEvent";
import { LoggerService } from "@bluelibs/logger-bundle";

@Service()
export class RedisMessenger implements IMessenger {
  listener: RedisClient;
  pusher: RedisClient;
  protected queue: Queue;
  protected channelMap: {
    [key: string]: MessageHandleType[];
  } = {};

  constructor(
    @Inject(IS_LIVE_DEBUG)
    protected readonly isDebug: boolean,
    @Inject(REDIS_OPTIONS)
    protected readonly options: ClientOpts,
    protected readonly eventManager: EventManager,
    protected readonly logger: LoggerService
  ) {
    this.queue = new Queue({
      autostart: true,
    });
    this.listener = createClient(options);
    this.pusher = createClient(options);

    this.initListener();
    this.attachEventsToListener();
  }

  /**
   * @param channels
   * @param data
   */
  async publish(channels: string[], data: ISubscriptionEvent) {
    const msg = EJSON.stringify(data);

    channels.forEach((channel) => {
      this.pusher.publish(channel, msg);
    });
  }

  /**
   * Attach events to log
   */
  protected attachEventsToListener() {
    this.listener.on("error", (err) => {
      this.logger.error(`Redis - An error occured: \n`, JSON.stringify(err));
    });
    this.listener.on("end", () => {
      this.logger.error("Redis - Connection to redis ended");
    });
    this.listener.on("reconnecting", (err) => {
      if (err) {
        this.logger.error(
          "Redis - There was an error when re-connecting to redis",
          JSON.stringify(err)
        );
      }
    });
    this.listener.on("connect", (err) => {
      if (!err) {
        this.logger.info("Redis - Established connection to redis.");
      } else {
        this.logger.error(
          "Redis - There was an error when connecting to redis",
          JSON.stringify(err)
        );
      }

      this.eventManager.emit(new RedisConnectionResumedEvent());
    });
  }

  /**
   * @param channel
   * @param handler
   */
  subscribe(channel: string, handler: MessageHandleType) {
    this.queue.push(() => {
      if (!this.channelMap[channel]) {
        this.initChannel(channel);
      }
      this.channelMap[channel].push(handler);
    });
  }

  /**
   * @param {string} channel
   * @param {function} handler
   */
  unsubscribe(channel, handler: MessageHandleType) {
    this.queue.push(() => {
      if (!this.channelMap[channel]) {
        return;
      }

      this.channelMap[channel] = this.channelMap[channel].filter((_handler) => {
        return _handler !== handler;
      });

      if (this.channelMap[channel].length === 0) {
        this.destroyChannel(channel);
      }
    });
  }

  /**
   * Initializes listening for redis messages
   * @private
   */
  initListener() {
    this.listener.on("message", (channel, _message) => {
      if (this.channelMap[channel]) {
        const message = EJSON.parse(_message);
        this.channelMap[channel].forEach((channelHandler) => {
          channelHandler(message);
        });
      }
    });
  }

  /**
   * @param channel
   * @private
   */
  protected initChannel(channel) {
    this.listener.subscribe(channel);
    this.channelMap[channel] = [];
  }

  /**
   * @param channel
   * @private
   */
  protected destroyChannel(channel) {
    this.listener.unsubscribe(channel);
    delete this.channelMap[channel];
  }
}
