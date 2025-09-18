import { EJSON } from "../src";
import { ObjectId } from "../src/objectid";
import * as Benchmark from "benchmark";

// Define a custom type for the benchmark
class Distance {
  constructor(public value: number, public unit: string) {}

  toJSONValue() {
    return { value: this.value, unit: this.unit };
  }

  typeName() {
    return "Distance";
  }
}

EJSON.addType("Distance", (json: any) => {
  return new Distance(json.value, json.unit);
});

// Create a complex data object for testing
const complexObject = {
  _id: new ObjectId(),
  name: "Benchmark Test",
  createdAt: new Date(),
  value: Math.random() * 1000,
  isActive: true,
  tags: ["performance", "ejson", "benchmark"],
  measurements: {
    distance: new Distance(100, "km"),
    time: 3600,
  },
  history: [
    { event: "created", timestamp: new Date(Date.now() - 10000) },
    { event: "updated", timestamp: new Date() },
  ],
  binaryData: Buffer.from("This is some binary data for the benchmark"),
  regexp: /^[a-z0-9]+$/i,
  aNullValue: null,
};

const jsonString = JSON.stringify(complexObject);
const ejsonString = EJSON.stringify(complexObject);

const suite = new Benchmark.Suite();

console.log("Starting benchmark suite...");

suite
  .add("JSON.stringify", () => {
    JSON.stringify(complexObject);
  })
  .add("EJSON.stringify", () => {
    EJSON.stringify(complexObject);
  })
  .add("JSON.parse", () => {
    JSON.parse(jsonString);
  })
  .add("EJSON.parse", () => {
    EJSON.parse(ejsonString);
  })
  .on("cycle", (event: any) => {
    console.log(String(event.target));
  })
  .on("complete", function (this: any) {
    console.log("\nFastest for parsing is " + this.filter("fastest").map("name"));
  })
  .run({ async: true });
