import { Bundle } from "@bluelibs/core";
import { EJSON } from "@bluelibs/ejson";
import { Channel, connect, Connection, Options } from "amqplib";
import { RabbitMQBundleConfigType } from "./defs";

export class RabbitMQBundle extends Bundle<
  RabbitMQBundleConfigType,
  RabbitMQBundleConfigType
> {
  public connection: Connection;
  public channel: Channel;

  protected defaultConfig = {
    url: "amqp://localhost:5672/",
    consume: true,
  };

  protected assertedQueues: string[] = [];

  async init() {
    this.connection = await connect(this.config.url);
    this.channel = await this.connection.createChannel();
  }

  public async assertQueue(queue: string, options?: Options.AssertQueue) {
    return this.channel.assertQueue(queue, options);
  }

  /**
   * Publish the message to the queue
   *
   * @param queue
   * @param message
   * @param options
   */
  public publish(
    queue: string,
    message: any,
    options?: Options.Publish
  ): boolean {
    return this.channel.sendToQueue(
      queue,
      Buffer.from(EJSON.stringify(message)),
      options
    );
  }

  /**
   * Consume a message
   * @param queue
   * @param handler
   * @param options
   */
  public consume(queue: string, handler, options?: Options.Consume) {
    if (!this.config.consume) {
      return;
    }

    this.channel.consume(
      queue,
      async (msg) => {
        await handler(EJSON.parse(msg.content.toString()));
        if (!options.noAck) {
          this.channel.ack(msg);
        }
      },
      options
    );
  }

  async shutdown() {
    await this.channel.close();
    await this.connection.close();
  }
}
