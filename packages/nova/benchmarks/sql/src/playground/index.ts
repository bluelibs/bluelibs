import { testSuite } from "../common";
import { RUN_FIXTURES } from "../constants";
import { setup, db } from "./db";
import { runFixtures } from "./fixtures";
import { createSuites } from "./tests";

async function run() {
  await setup();
  if (RUN_FIXTURES) {
    await runFixtures();
  }
  await testSuite(createSuites(), {
    runSanityChecks: false,
    warmup: 100,
  });
  process.exit(0);
}

run();
