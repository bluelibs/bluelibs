import { expect } from "chai";
import { Collection } from "mongodb";
import { query } from "../../core/api";
import { getRandomCollection } from "./helpers";

describe("Aggregation options", function () {
  let collection: Collection;
  let lastAggregateOptions: any;

  beforeAll(async () => {
    collection = await getRandomCollection("AggregationOptions");
  });

  beforeEach(async () => {
    lastAggregateOptions = null;
    await collection.deleteMany({});
  });

  it("forwards driver aggregation options to Collection.aggregate()", async () => {
    await collection.insertOne({ number: 1 });

    const originalAggregate = collection.aggregate.bind(collection);
    collection.aggregate = ((pipeline: any, options: any) => {
      lastAggregateOptions = options;
      return originalAggregate(pipeline, options);
    }) as any;

    const results = await query(collection, {
      number: 1,
      $: {
        options: {
          allowDiskUse: false,
          batchSize: 5,
          comment: "nova-aggregation-options",
          readPreference: "secondaryPreferred",
        },
      },
    }).fetch();

    expect(results).to.have.length(1);
    expect(results[0].number).to.equal(1);

    expect(lastAggregateOptions).to.exist;
    expect(lastAggregateOptions.allowDiskUse).to.equal(false);
    expect(lastAggregateOptions.batchSize).to.equal(5);
    expect(lastAggregateOptions.comment).to.equal("nova-aggregation-options");
    expect(lastAggregateOptions.readPreference).to.equal("secondaryPreferred");
  });
});

