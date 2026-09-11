import { EventManager } from "@bluelibs/core";
import { createKernel } from "./ecosystem";
import { LoggerService } from "../services/LoggerService";
import { LogEvent } from "../events";
import { LogLevel } from "../defs";
import { Log } from "../models";
import { ConsoleListener } from "../listeners/ConsoleListener";

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

const levels = [
  LogLevel.DEBUG,
  LogLevel.INFO,
  LogLevel.WARNING,
  LogLevel.ERROR,
  LogLevel.CRITICAL,
];

test.each([
  [LogLevel.DEBUG, levels],
  [LogLevel.INFO, levels.slice(1)],
  [LogLevel.WARNING, levels.slice(2)],
  [LogLevel.ERROR, levels.slice(3)],
  [LogLevel.CRITICAL, levels.slice(4)],
  [undefined, levels],
])(
  "console threshold %s is inclusive and preserves custom events",
  async (level, expected) => {
    const kernel = createKernel({ level });
    const output = jest.spyOn(console, "log").mockImplementation(() => {});
    try {
      await kernel.init();
      output.mockClear();
      const received: LogLevel[] = [];
      kernel.container.get(EventManager).addListener(LogEvent, (event) => {
        received.push(event.data.log.level);
      });
      const logger = kernel.container.get(LoggerService);
      for (const severity of levels) {
        await logger.send(
          new Log(`${severity} message`, severity, "test context")
        );
      }
      expect(
        output.mock.calls.map(([message]) => message.split("\n")[1])
      ).toEqual(expected.map((severity) => `${severity} message`));
      expect(received).toEqual(levels);
    } finally {
      await kernel.shutdown();
      output.mockRestore();
    }
  }
);

test("console can be disabled without suppressing custom events", async () => {
  const kernel = createKernel({ console: false, level: LogLevel.CRITICAL });
  const output = jest.spyOn(console, "log").mockImplementation(() => {});
  try {
    await kernel.init();
    output.mockClear();
    const received: LogLevel[] = [];
    kernel.container.get(EventManager).addListener(LogEvent, (event) => {
      received.push(event.data.log.level);
    });
    for (const level of levels) {
      await kernel.container.get(LoggerService).send(new Log("message", level));
    }
    expect(output).not.toHaveBeenCalled();
    expect(received).toEqual(levels);
  } finally {
    await kernel.shutdown();
    output.mockRestore();
  }
});

test("listener defaults to allowing every severity", () => {
  expect(new ConsoleListener().minLogLevel).toBe(LogLevel.DEBUG);
});
