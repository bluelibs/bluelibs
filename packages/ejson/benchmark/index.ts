import { EJSON, ObjectId } from "../src";
import * as Benchmark from "benchmark";
import * as zlib from "zlib";

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

console.log("Starting benchmark suite (single complex object)...");

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

// -------- Batch vs Non-Batch on 1000 flat, relatively complex rows --------

const buildRows = (n: number) => {
  const rows = new Array(n).fill(0).map((_, i) => {
    const bin = new Uint8Array(8);
    for (let j = 0; j < bin.length; j++) bin[j] = (i * 13 + j) & 255;
    return {
      _id: new ObjectId(),
      createdAt: new Date(1700000000000 + i * 1234),
      active: i % 2 === 0,
      name: `User ${i}`,
      score: Math.floor(Math.random() * 1000),
      re: /[a-z0-9]+/i,
      dist: new Distance(100 + i, "km"), // custom type
      bin, // binary column
    };
  });
  return rows;
};

const rows = buildRows(1000);
const jsonRows = JSON.stringify(rows);
const ejsonRows = EJSON.stringify(rows);
const ejsonBatchRows = (EJSON as any).stringifyBatch(rows, { preferPackedObjectId: true });

const sizeOf = (s: string) => Buffer.byteLength(s, "utf8");
const gzipSize = (s: string) => zlib.gzipSync(Buffer.from(s)).byteLength;
const brotliSize = (s: string) =>
  "brotliCompressSync" in zlib
    ? (zlib as any).brotliCompressSync(Buffer.from(s)).byteLength
    : null;

const bytes = {
  json: sizeOf(jsonRows),
  ejson: sizeOf(ejsonRows),
  batch: sizeOf(ejsonBatchRows),
};
const gz = {
  json: gzipSize(jsonRows),
  ejson: gzipSize(ejsonRows),
  batch: gzipSize(ejsonBatchRows),
};
const br = {
  json: brotliSize(jsonRows),
  ejson: brotliSize(ejsonRows),
  batch: brotliSize(ejsonBatchRows),
};

const pct = (a: number, b: number) => ((a - b) / a) * 100;
const diff = (a: number, b: number) => a - b;

console.log("\nBatch vs Non-Batch (1000 rows) sizes (bytes):");
console.log("Raw:");
console.log("  JSON:", bytes.json);
console.log("  EJSON:", bytes.ejson);
console.log("  Batch:", bytes.batch);
console.log(
  `  Batch vs EJSON: -${diff(bytes.ejson, bytes.batch)} bytes (${pct(bytes.ejson, bytes.batch).toFixed(1)}%)`
);
console.log(
  `  Batch vs JSON: -${diff(bytes.json, bytes.batch)} bytes (${pct(bytes.json, bytes.batch).toFixed(1)}%)`
);

console.log("Gzip:");
console.log("  JSON:", gz.json);
console.log("  EJSON:", gz.ejson);
console.log("  Batch:", gz.batch);
console.log(
  `  Batch vs EJSON: -${diff(gz.ejson, gz.batch)} bytes (${pct(gz.ejson, gz.batch).toFixed(1)}%)`
);
console.log(
  `  Batch vs JSON: -${diff(gz.json, gz.batch)} bytes (${pct(gz.json, gz.batch).toFixed(1)}%)`
);

if (br.json != null) {
  console.log("Brotli:");
  console.log("  JSON:", br.json);
  console.log("  EJSON:", br.ejson);
  console.log("  Batch:", br.batch);
  console.log(
    `  Batch vs EJSON: -${diff(br.ejson, br.batch)} bytes (${pct(br.ejson, br.batch).toFixed(1)}%)`
  );
  console.log(
    `  Batch vs JSON: -${diff(br.json, br.batch)} bytes (${pct(br.json, br.batch).toFixed(1)}%)`
  );
}

const suite2 = new Benchmark.Suite();
console.log("\nStarting benchmark suite (1000 rows batch vs non-batch)...");

suite2
  .add("JSON.stringify[1000]", () => {
    JSON.stringify(rows);
  })
  .add("EJSON.stringify[1000]", () => {
    EJSON.stringify(rows);
  })
  .add("EJSON.stringifyBatch[1000]", () => {
    (EJSON as any).stringifyBatch(rows);
  })
  .add("JSON.parse[1000]", () => {
    JSON.parse(jsonRows);
  })
  .add("EJSON.parse[1000]", () => {
    EJSON.parse(ejsonRows);
  })
  .add("EJSON.parseBatch[1000]", () => {
    (EJSON as any).parseBatch(ejsonBatchRows);
  })
  .on("cycle", (event: any) => {
    console.log(String(event.target));
  })
  .on("complete", function (this: any) {
    console.log("\nFastest in this suite is " + this.filter("fastest").map("name"));
  })
  .run({ async: true });
