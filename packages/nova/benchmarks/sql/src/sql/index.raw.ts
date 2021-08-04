import { testSuite } from "../common";
import "./db";
import { runFixtures } from "./fixtures";
import { suites } from "./tests.raw";
import { RUN_FIXTURES } from "../constants";

async function run() {
  if (RUN_FIXTURES) {
    await runFixtures();
  }
  await testSuite(suites, { runSanityChecks: false });
  process.exit(0);
}

run();
