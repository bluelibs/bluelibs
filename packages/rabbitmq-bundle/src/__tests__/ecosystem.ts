import { Kernel } from "@bluelibs/core";
import { LoggerBundle } from "@bluelibs/logger-bundle";
import { RabbitMQBundle } from "../RabbitMQBundle";

export const createKernel = (): Kernel => {
  return new Kernel({
    bundles: [
      new LoggerBundle(),
      new RabbitMQBundle({
        url: "amqp://localhost:5672/",
      }),
    ],
  });
};
