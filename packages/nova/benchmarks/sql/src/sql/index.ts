import { testSuite } from "../common";
import { RUN_FIXTURES } from "../constants";
import * as db from "./db";
import { runFixtures } from "./fixtures";
import { suites } from "./tests.sequelize";
// import { suites } from "./tests.raw";

async function run() {
  if (RUN_FIXTURES) {
    await runFixtures();
  }
  await testSuite(suites);
  process.exit(0);
}

run();
