import * as _ from "lodash";
import CollectionNode from "../nodes/CollectionNode";

export default async function applyReducers(root: CollectionNode) {
  for (const childCollectionNode of root.collectionNodes) {
    await applyReducers(childCollectionNode);
  }

  const processedReducers = [];
  const reducersQueue = [...root.reducerNodes];

  // TODO: find out if there's an infinite reducer inter-dependency
  while (reducersQueue.length) {
    const reducerNode = reducersQueue.shift();

    // If this reducer depends on other reducers
    if (reducerNode.dependencies.length) {
      // If there is an unprocessed reducer, move it at the end of the queue
      const allDependenciesComputed = _.every(reducerNode.dependencies, (dep) =>
        processedReducers.includes(dep)
      );
      if (allDependenciesComputed) {
        for (const result of root.results) {
          await reducerNode.compute(result);
        }
        processedReducers.push(reducerNode.name);
      } else {
        // Move it at the end of the queue
        reducersQueue.push(reducerNode);
      }
    } else {
      for (const result of root.results) {
        await reducerNode.compute(result);
      }

      processedReducers.push(reducerNode);
    }
  }
}
