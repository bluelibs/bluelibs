import * as _ from "lodash";
import { BSON, ObjectId } from "mongodb";
import CollectionNode from "../nodes/CollectionNode";
import QueryScheduler from "../QueryScheduler";

const MAX_PARENTS = 128;
const MAX_INPUT_BYTES = 256 * 1024;
const LOOKUP_OPTIONS = new Set([
  "allowDiskUse",
  "batchSize",
  "maxTimeMS",
  "collation",
  "comment",
]);

function isIdentifier(value: any) {
  return (
    typeof value === "string" ||
    (typeof value === "number" && Number.isFinite(value)) ||
    value instanceof ObjectId
  );
}

/** Batches fixed per-parent pagination without rereading or changing parent data. */
export default async function processPaginatedNode(
  node: CollectionNode,
  scheduler?: QueryScheduler,
): Promise<boolean> {
  if (
    typeof node.props === "function" ||
    typeof node.linker.linkConfig.filters === "function" ||
    node.props.pipeline?.length ||
    !node.props.options?.sort ||
    node.reducerNodes.some((reducer) => reducer.hasPipeline) ||
    node.isOneResult ||
    node.session?.inTransaction?.() ||
    !node.collection.db
  )
    return false;

  const joinField = node.isVirtual
    ? node.linkStorageField
    : node.linkForeignStorageField;
  const sourceField = node.isVirtual
    ? node.linkForeignStorageField
    : node.linkStorageField;
  if (
    [joinField, sourceField].some((field) =>
      field.split(".").some((part) => /^\d+$/.test(part)),
    )
  ) {
    return false;
  }
  const { pipeline, aggregateOptions } = node.getAggregationPipeline();
  if (Object.keys(aggregateOptions).some((key) => !LOOKUP_OPTIONS.has(key)))
    return false;

  // Per-parent link filters override the same top-level field in query props.
  if (pipeline[0]?.$match) {
    delete pipeline[0].$match[joinField];
    if (_.isEmpty(pipeline[0].$match)) pipeline.shift();
  }

  const batches: Array<Array<{ index: number; key: any }>> = [];
  let batch = [];
  let bytes = 0;
  const parents = node.parent.results;
  for (let index = 0; index < parents.length; index++) {
    const key = _.get(parents[index], sourceField);
    if (!node.isVirtual && !key) continue;
    if (!node.isVirtual && node.linker.isMany()) {
      if (!Array.isArray(key) || !key.every(isIdentifier)) return false;
      if (key.length === 0) continue;
    } else if (!isIdentifier(key)) return false;
    const row = { index, key };
    const size = BSON.calculateObjectSize(row);
    if (size > MAX_INPUT_BYTES) return false;
    if (batch.length === MAX_PARENTS || bytes + size > MAX_INPUT_BYTES) {
      batches.push(batch);
      batch = [];
      bytes = 0;
    }
    batch.push(row);
    bytes += size;
  }
  if (batch.length) batches.push(batch);

  const resultsByParent: any[][] = parents.map(() => []);
  for (const rows of batches) {
    const lookupPipeline = [
      { $documents: { $literal: rows } },
      {
        $lookup: {
          from: node.collection.collectionName,
          localField: "key",
          foreignField: joinField,
          pipeline,
          as: "children",
        },
      },
      // Unwinding immediately avoids building a large parent/children document.
      { $unwind: "$children" },
      { $project: { _id: 0, index: 1, child: "$children" } },
    ];
    // Keep the collection namespace so its default collation and driver options
    // remain identical to ordinary per-parent reads. The initial match reads nothing.
    const execute = () =>
      node.collection
        .aggregate(
          [
            { $match: { $expr: false } },
            { $unionWith: { pipeline: lookupPipeline } },
          ],
          {
            allowDiskUse: true,
            batchSize: 1000000,
            ...aggregateOptions,
            session: node.session,
          },
        )
        .toArray();
    const results = scheduler ? await scheduler.run(execute) : await execute();
    for (const result of results)
      resultsByParent[result.index].push(result.child);
  }
  parents.forEach((parent, index) => {
    parent[node.name] = resultsByParent[index];
  });
  node.results = resultsByParent.flat();
  return true;
}
