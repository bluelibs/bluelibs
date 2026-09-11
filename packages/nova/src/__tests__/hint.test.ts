import { query } from "../core/api";
import { AggregateOptions, Document } from "mongodb";

// We use Jest for assertions; no need for chai here.

describe("Query hint option", () => {
  it("should forward options.hint to MongoDB aggregate()", async () => {
    // Capture the options passed to aggregate
    let capturedOptions: AggregateOptions | null = null;

    const aggregateSpy = jest.fn((_pipeline: Document[], options: AggregateOptions) => {
      capturedOptions = options;
      return {
        toArray: jest.fn().mockResolvedValue([]),
      };
    });

    // Minimal collection mock needed by Nova's Query engine
    // why: only a partial stand-in for the driver Collection, so it stays any.
    const collectionMock: any = {
      collectionName: "dummyCollection",
      aggregate: aggregateSpy,
    };

    // Execute a Nova query with the hint option
    await query(collectionMock, {
      $: {
        options: {
          hint: "myindexname",
        },
      },
    }).fetch();

    // Ensure aggregate was called
    expect(aggregateSpy).toHaveBeenCalled();

    // The options passed to aggregate should contain the hint we provided
    expect(capturedOptions).toBeTruthy();
    expect(capturedOptions.hint).toBe("myindexname");
  });
});
