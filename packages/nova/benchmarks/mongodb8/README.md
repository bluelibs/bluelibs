# MongoDB 8 performance benchmark

From `packages/nova`, install development dependencies and compile:

```sh
npm run compile
MONGO_URL=mongodb://127.0.0.1:27943 node benchmarks/mongodb8/index.cjs
```

Use a dedicated local MongoDB server. The benchmark creates a uniquely named
`nova_benchmark_*` database and drops only that database when finished. It leaves
the server running. `NOVA_BENCHMARK_OUTPUT=/path/results.json` saves raw results.
`NOVA_BASELINE_REF` overrides the default baseline commit, `794b442`, which already
contains `maxCap` but predates these performance changes. That commit must exist
in the local Git checkout.

The benchmark loads the baseline traversal functions in an isolated Node process;
it does not edit compiled files or the checkout. Fixtures, indexes, driver,
scheduler and runtime stay identical between variants. Every comparison validates
exact output, including array order, before accepting a timing sample.

[Raw measured results](./results.json) include p95 timings and command counts.

## Measured results

Measured on MongoDB Community **8.3.13**, Node driver **6.21.0**, Node **25.7.0**,
macOS ARM64, with a warm cache and `maxCap` omitted. Each variant has three warmups;
measurement order rotates. Timings are end-to-end p50. Pagination has 100 parents
and 100 children per parent, fetching the top three after skipping two with index
`{ postId: 1, seq: -1, _id: 1 }`. Inverse membership has 1,000 parents, 5,000 children
and five memberships per child.

| Case | Baseline | This implementation | Aggregate commands |
| --- | ---: | ---: | --- |
| Fixed per-parent pagination | 18.457 ms | 6.126 ms | 101 → 2 |
| Functional per-parent fallback | 18.457 ms | 7.812 ms | 101 → 101 |
| Pagination, added 5 ms per request | 771.379 ms | 23.654 ms | 101 → 2 |
| Functional fallback, added 5 ms per request | 771.379 ms | 114.087 ms | 101 → 101 |
| Inverse many-to-many assembly | 4,833.946 ms | 26.455 ms | 2 → 2 |
| Ordinary graph with author and tags | 3.132 ms | 3.080 ms | 3 → 3 |

Pagination and ordinary graph cases use 12 measured samples per variant; the
simulated-delay cases use five and the heavy membership case uses six. The added
5 ms is an explicit logical-request delay, including every new batch, rather than
a WAN measurement. The membership fixture exposes worst-case scaling and does
not predict the speedup of an average production query.

The native `lookup(..., { strategy: "equality" })` cases compare sorted join output
against the default pipeline strategy. They include the sort and projection cost,
so they differ from a benchmark of the lookup stage alone.

## Correctness checks

```sh
TEST_DB=mongodb://127.0.0.1:27943/test npm test
# Requires a replica set, including a single-node local replica set:
TEST_DB=mongodb://127.0.0.1:27943/test npm run test:transactions
```

The tests cover shared document copies, descendant projection, aliases, reducers,
sort/skip/limit, dotted and computed link fields, batch bounds, collection-default
collation, explicit collation, empty results, request failures and the shared query
cap. Transaction checks run separately so the default suite still works against
a standalone server.

## Query behavior

Fixed pagination with an explicit sort batches already-fetched parent link values through `$documents`
and an indexed `$lookup`, preserving computed parent fields. It uses a collection
aggregation with an empty initial match and `$unionWith`, so the child's default
collation and driver options remain in effect. An immediate `$unwind` streams
children without requiring one large parent-plus-children result document.

Transactions, unsorted pagination, parent-dependent functions, dynamic hardwired filters, custom
pipelines, pipeline reducers, unsupported aggregate options and non-scalar join
keys use the original per-parent query shape. The fallback runs up to eight
requests per link, additionally limited by `maxCap`; transactions run one request
at a time across the query. General graph traversal still batches collections.

Native equality lookup remains opt-in because MongoDB matches missing fields as
null and applies its own array matching rules. The default lookup helper retains
its prior semantics. Direct-many Nova assembly retains ID order and duplicates.

MongoDB's official references explain [equality lookup optimization](https://www.mongodb.com/docs/v8.3/core/aggregation-pipeline-optimization/),
[`$lookup` semantics](https://www.mongodb.com/docs/v8.3/reference/operator/aggregation/lookup/),
[`$documents`](https://www.mongodb.com/docs/v8.3/reference/operator/aggregation/documents/),
[`$unionWith` collation and transaction restrictions](https://www.mongodb.com/docs/manual/reference/operator/aggregation/unionwith/),
and [driver transaction constraints](https://www.mongodb.com/docs/drivers/node/v6.x/crud/transactions/).
