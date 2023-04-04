import { Bundle, EventManager } from "@bluelibs/core";
import { createKernel } from "./ecosystem";
import { LoggerService } from "../services/LoggerService";
import { LogEvent } from "../events";

test("Initialises and works", async () => {
  const kernel = createKernel();

  await kernel.init();

  const logger = kernel.container.get(LoggerService);
  const eventManager = kernel.container.get(EventManager);
  let inEvent = false;
  eventManager.addListener(LogEvent, (log) => {
    expect(log.data.log.message).toBe("hello");
    inEvent = true;
  });
  // write a short function that would take around 2-3ms
  function shortFunction() {
    let i = 0;
    while (i < 10000) {
      i * i - i + i * i * i;
      i++;
    }
  }

  await logger.info("hello");
  shortFunction();
  await logger.info("hello", "context");
  shortFunction();
  await logger.error("hello");
  shortFunction();
  await logger.error("hello", "context");
  await logger.warning("hello");
  await logger.warning("hello", "context");
  await logger.critical("hello");
  await logger.critical("hello", "context");
  expect(inEvent).toBe(true);
});
