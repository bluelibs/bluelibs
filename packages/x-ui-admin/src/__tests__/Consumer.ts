import { Consumer } from "../react/models/Consumer";

describe("FormConsumer", () => {
  test("should work", () => {
    const elements = [
      {
        id: "1",
        name: 123,
      },
      {
        id: "2",
        name: 124,
      },
      {
        id: "3",
        name: 125,
      },
    ];

    const consumer = new Consumer(elements);

    expect(consumer.isConsumed()).toBe(false);
    const e1 = consumer.consume("1");
    expect(e1.name).toBe(123);

    expect(consumer.isElementConsumed("1")).toBe(true);
    expect(consumer.isElementConsumed("2")).toBe(false);
    expect(consumer.isConsumed()).toBe(false);

    const rest = consumer.rest();
    expect(rest).toHaveLength(2);
    expect(consumer.isConsumed()).toBe(true);
    expect(consumer.isElementConsumed("2")).toBe(true);
    expect(consumer.isElementConsumed("3")).toBe(true);

    expect(() => consumer.consume("1")).toThrowError(
      Consumer.Errors.AlreadyConsumed
    );
    expect(() => consumer.consume("4")).toThrowError(
      Consumer.Errors.ElementNotFound
    );
  });
});
