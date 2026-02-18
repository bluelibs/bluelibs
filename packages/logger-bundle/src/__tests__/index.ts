import { Bundle, EventManager } from "@bluelibs/core";
import { createKernel } from "./ecosystem";
import { LoggerService } from "../services/LoggerService";
import { LogEvent } from "../events";
import { LogLevel } from "../defs";

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

test("LoggerBundle filters log events based on level option", async () => {
  const kernel = createKernel();
  kernel.config.bundles[0].config.level = LogLevel.ERROR;

  await kernel.init();

  const logger = kernel.container.get(LoggerService);
  const eventManager = kernel.container.get(EventManager);
  let inEvent = false;
  eventManager.addListener(LogEvent, (log) => {
    if (log.data.log.level === LogLevel.ERROR) {
      inEvent = true;
    }
  });

  await logger.info("info log");
  await logger.warning("warning log");
  await logger.error("error log");

  expect(inEvent).toBe(true);
});
