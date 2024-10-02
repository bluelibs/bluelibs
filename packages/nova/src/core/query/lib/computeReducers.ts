import * as _ from "lodash";
import CollectionNode from "../nodes/CollectionNode";

export default async function applyReducers(root: CollectionNode) {
  for (const childCollectionNode of root.collectionNodes) {
    await applyReducers(childCollectionNode);
  }

  const processedReducers = [];
  const reducersQueue = [...root.reducerNodes];

  while (reducersQueue.length) {
    const reducerNode = reducersQueue.shift();

    if (reducerNode.dependencies.length) {
      const allDependenciesComputed = _.every(reducerNode.dependencies, (dep) =>
        processedReducers.includes(dep.name)
      );
      if (allDependenciesComputed) {
        for (const result of root.results) {
          await reducerNode.compute(result);
        }
        processedReducers.push(reducerNode.name);
      } else {
        reducersQueue.push(reducerNode);
      }
    } else {
      for (const result of root.results) {
        await reducerNode.compute(result);
      }
      processedReducers.push(reducerNode.name); // Consistent usage here
    }
  }
}
