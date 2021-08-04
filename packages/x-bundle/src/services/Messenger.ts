import { Inject } from "@bluelibs/core";
import Queue from "queue";
import { IS_LIVE_DEBUG } from "../constants";
import { IMessenger, MessageHandleType, ISubscriptionEvent } from "../defs";

/**
 * It has the responsability of
 * 1. Listening to message queues and push to them
 * 2. Working in queues to avoid race conditions and properly do cleanups
 * 3. Do serialisation and deserialisation of messages. We transmit objects.
 */
export class Messenger implements IMessenger {
  protected queue: Queue;
  protected channelMap: {
    [key: string]: MessageHandleType[];
  } = {};

  constructor(
    @Inject(IS_LIVE_DEBUG)
    protected readonly isDebug: boolean
  ) {
    this.queue = new Queue({
      autostart: true,
    });
  }

  subscribe(channel: string, handler: MessageHandleType) {
    this.queue.push(() => {
      if (!this.channelMap[channel]) {
        this.channelMap[channel] = [];
      }

      this.channelMap[channel].push(handler);
    });
  }

  unsubscribe(channel: string, handler: MessageHandleType) {
    this.queue.push(() => {
      if (!this.channelMap[channel]) {
        return;
      }

      this.channelMap[channel] = this.channelMap[channel].filter(
        (_handler) => _handler !== handler
      );
    });
  }

  async publish(channels: string[], data: ISubscriptionEvent) {
    this.queue.push(async () => {
      for (const channel of channels) {
        if (this.channelMap[channel]) {
          this.isDebug && console.log(`[${channel}] Publishing`, data);
          for (const handler of this.channelMap[channel]) {
            await handler(data);
          }
        }
      }
    });
  }
}
