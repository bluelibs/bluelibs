import { testSuite } from "../common";
import { RUN_FIXTURES } from "../constants";
import { setup, db } from "./db";
import { runFixtures } from "./fixtures";
import { suites } from "./tests";

async function run() {
  await setup();
  if (RUN_FIXTURES) {
    await runFixtures();
  }
  await testSuite(suites);
  process.exit(0);
}

run();
