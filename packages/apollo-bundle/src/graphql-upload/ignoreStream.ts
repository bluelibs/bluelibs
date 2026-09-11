// @ts-check

import { Readable } from "stream";

/**
 * Safely ignores a Node.js readable stream.
 * @param {import("node:stream").Readable} stream Node.js readable stream.
 */
export default function ignoreStream(stream: Readable) {
  // Prevent an unhandled error from crashing the process.
  stream.on("error", () => {});

  // Waste the stream.
  stream.resume();
}
