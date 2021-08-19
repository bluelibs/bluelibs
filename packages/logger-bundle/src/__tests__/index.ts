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
  await logger.info("hello");
  await logger.error("hello");
  await logger.warning("hello");
  await logger.critical("hello");
  expect(inEvent).toBe(true);
});
