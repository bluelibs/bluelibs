This bundle integrates with RabbitMQ to allow robust and failsafe queues designed to meet your needs.

## Install

```bash
npm i --save @bluelibs/rabbitmq-bundle
```

```ts
const kernel = new Kernel({
  bundles: [
    // ...
    new RabbitMQBundle({
      url: "http://localhost:5672",
    }),
  ],
});
```

## Usage

API can be found here: http://www.squaremobius.net/amqp.node/channel_api.html

```ts
import { RabbitMQBundle } from "@bluelibs/rabbitmq-bundle";
import { Service } from "@bluelibs/core";

interface EmailMessage {
  to: string;
  subject: string;
  content: string;
}

const EMAIL_QUEUE_NAME = "send_emails";

@Service()
class MyService {
  constructor(protected readonly mq: RabbitMQBundle) {}

  async init() {
    this.mq.assertQueue(EMAIL_QUEUE_NAME);

    // Automatic serialisation via EJSON
    this.mq.consume(
      EMAIL_QUEUE_NAME,
      (email: EmailMessage) => {
        // Send the message
        // If this throws, it will not acknowledge the message, unless you have noAck: true
      },
      options
    );
  }

  queueEmail(email: EmailMessage) {
    this.mq.publish(EMAIL_QUEUE_NAME, email);
  }
}
```

Then in your bundles init() make sure to run `this.warmup([MyService])` so the consumers are initialised.

Typically, you would have separate infrastructure for these consumers, but having the code in one place can be helpful as your consumers might have dependencies with other app modules. You can also specify whether to consume or not based on an environment variable.

```ts
// This configuration will disable all consumers silently. You can still add consumers, but they will not work.
// This allows you to easily split consumer/non-consumer queues while keeping the code close to each other.

new RabbitMQBundle({
  consume: false,
});
```
