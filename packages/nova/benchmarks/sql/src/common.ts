import { v4 as uuid } from "uuid";
import { sanity } from "./sanity";
import { COMMENT_TEXT, TEST_ITERATIONS, POST_DESCRIPTION } from "./constants";
import { PerformanceObserver, performance } from "perf_hooks";
export function createRandomPost(index) {
  return {
    title: `Post - ${index}`,
    description: POST_DESCRIPTION,
  };
}

export function createRandomUser() {
  return {
    name: `John Smith ${uuid()}`,
    email: `user-${uuid()}@app.com`,
    password: `12345`,
  };
}

export function createComment() {
  return {
    text: COMMENT_TEXT,
  };
}

export interface ITestSuite {
  name: string;
  run: Function;
  only?: boolean;
  skip?: boolean;
}

export interface ITestResult {
  name?: string;
  fastest: number;
  slowest: number;
  mean: number;
  iterations: number;
  firstRun: number;
}

export async function testSuite(
  suites: ITestSuite[],
  options: {
    runSanityChecks?: boolean;
    times?: number;
    warmup?: number;
  } = {}
) {
  const onlySuites = suites.filter((suite) => suite.only === true);
  if (onlySuites.length > 0) {
    suites = onlySuites;
  }
  suites = suites.filter((suite) => suite.skip !== true);

  for (const suite of suites) {
    const result = await testRunner(suite, options);
    console.log(suite.name);
    console.log(
      `fastest: ${result.fastest.toFixed(
        4
      )}ms | slowest: ${result.slowest.toFixed(
        4
      )}ms | mean: ${result.mean.toFixed(
        4
      )}ms | firstRun: ${result.firstRun.toFixed(4)}ms | iterations: ${
        result.iterations
      }`
    );
    console.log("--");
  }
  console.log("✓ Done");
}

export async function testRunner(
  suite: ITestSuite,
  options: {
    runSanityChecks?: boolean;
    times?: number;
    warmup?: number;
  } = {}
): Promise<ITestResult> {
  options = Object.assign(
    { runSanityChecks: true, times: TEST_ITERATIONS, warmup: 0 },
    options
  );

  let sum = 0;
  let slowest = 0;
  let firstRun = 0;
  let fastest = Infinity;

  for (let i = 0; i < options.warmup; i++) {
    await suite.run();
  }

  for (let i = 0; i < options.times; i++) {
    const startTime = performance.now();
    const result = await suite.run();

    const timeElapsed = performance.now() - startTime;
    if (timeElapsed > slowest) {
      slowest = timeElapsed;
    }
    if (timeElapsed < fastest) {
      fastest = timeElapsed;
    }
    sum += timeElapsed;

    if (i === 0) {
      firstRun = timeElapsed;
    }

    if (options.runSanityChecks && i === 0 && sanity[suite.name]) {
      sanity[suite.name](result);
    }
  }

  return {
    name: suite.name,
    fastest,
    slowest,
    mean: sum / options.times,
    iterations: options.times,
    firstRun,
  };
}
