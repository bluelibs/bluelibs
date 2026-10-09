const path = require("node:path");
const Module = require("node:module");
const { execFileSync } = require("node:child_process");
const { performance } = require("node:perf_hooks");
const assert = require("node:assert/strict");
const { ObjectId } = require("mongodb");
const ts = require("typescript");
const packageRoot = path.resolve(__dirname, "../..");
const baselineRef = process.env.NOVA_BASELINE_REF || "794b442";
let commands = {};
const results = [];
function monitor(client) {
  client.on("commandStarted", (event) => {
    if (["aggregate", "getMore"].includes(event.commandName)) {
      commands[event.commandName] = (commands[event.commandName] || 0) + 1;
    }
  });
}

function canonical(value) {
  if (value instanceof ObjectId) return value.toHexString();
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonical(value[key])]),
    );
  return value;
}

// Load only the old traversal functions. Driver, fixture, scheduler and runtime
// stay identical, and each comparison checks exact output (including array order).
const old = new Map();
for (const name of [
  "processRecursiveNode",
  "processVirtualNode",
  "storeHypernovaResults",
]) {
  const file = `packages/nova/src/core/query/hypernova/${name}.ts`;
  const source = execFileSync("git", ["show", `${baselineRef}:${file}`], {
    cwd: packageRoot,
    encoding: "utf8",
  });
  const filename = path.join(
    packageRoot,
    `dist/core/query/hypernova/${name}.js`,
  );
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  loaded._compile(
    ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2019,
      },
    }).outputText,
    filename,
  );
  old.set(require(filename), loaded.exports.default);
}
async function baseline(operation) {
  const saved = new Map();
  for (const [entry, implementation] of old) {
    saved.set(entry, entry.default);
    entry.default = implementation;
  }
  try {
    return await operation();
  } finally {
    for (const [entry, implementation] of saved) entry.default = implementation;
  }
}

async function compare(group, variants, iterations = 12) {
  let expected;
  for (const variant of variants)
    for (let i = 0; i < 3; i++) {
      const result = canonical(await variant.run());
      if (!expected) expected = result;
      assert.deepEqual(result, expected, `${group}: ${variant.name}`);
    }
  const samples = new Map(variants.map((variant) => [variant, []]));
  for (let i = 0; i < iterations; i++) {
    const order = [
      ...variants.slice(i % variants.length),
      ...variants.slice(0, i % variants.length),
    ];
    for (const variant of order) {
      commands = {};
      const start = performance.now();
      const result = await variant.run();
      samples.get(variant).push({
        milliseconds: performance.now() - start,
        commands: { ...commands },
      });
      assert.deepEqual(
        canonical(result),
        expected,
        `${group}: ${variant.name}`,
      );
    }
  }
  for (const variant of variants) {
    const measured = samples.get(variant);
    const times = measured
      .map((sample) => sample.milliseconds)
      .sort((a, b) => a - b);
    const row = {
      group,
      variant: variant.name,
      samples: iterations,
      p50Ms: Number(times[Math.floor(times.length * 0.5)].toFixed(3)),
      p95Ms: Number(
        times[
          Math.min(times.length - 1, Math.floor(times.length * 0.95))
        ].toFixed(3),
      ),
      commands: measured[0].commands,
    };
    results.push(row);
    console.log(JSON.stringify(row));
  }
}

module.exports = { baselineRef, baseline, compare, results, monitor };
