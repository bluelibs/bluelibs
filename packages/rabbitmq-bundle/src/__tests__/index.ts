import { createKernel } from "./ecosystem";
import { RabbitMQBundle } from "../RabbitMQBundle";

test("should work", async () => {
  const kernel = createKernel();
  await kernel.init();

  const mq = kernel.container.get(RabbitMQBundle);
  const QUEUE_NAME = "aaa";

  await mq.channel.deleteQueue(QUEUE_NAME);
  await mq.assertQueue(QUEUE_NAME);

  return new Promise<void>(async (finished, reject) => {
    try {
      mq.consume(
        QUEUE_NAME,
        async (result) => {
          expect(result.result).toBe(1);
          finished();
          setTimeout(() => {
            kernel.shutdown();
          }, 1000);
        },
        {
          // noAck: true,
        }
      );

      mq.publish(QUEUE_NAME, {
        result: 1,
      });
    } catch (err) {
      reject(err);
    }
  });
});
