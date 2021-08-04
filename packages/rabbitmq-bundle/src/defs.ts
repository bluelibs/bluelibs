export type RabbitMQBundleConfigType = {
  url: string;
  /**
   * This refers to whether to allow consuming queues.
   * @default true
   */
  consume?: boolean;
};
