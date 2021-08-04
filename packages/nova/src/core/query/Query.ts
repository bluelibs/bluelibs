import * as _ from "lodash";
import { QueryBodyType, IQueryContext } from "../defs";
import CollectionNode from "./nodes/CollectionNode";
import hypernova from "./hypernova/hypernova";
import { Collection } from "mongodb";

export default class Query {
  public collection: Collection;
  private graph: CollectionNode;
  public readonly body: any;
  public queryName: string;

  /**
   * Everythig starts with a query. We build the graph based on the body.
   *
   * @param collection
   * @param body
   */
  constructor(
    collection: Collection,
    body: QueryBodyType,
    context?: IQueryContext
  ) {
    this.collection = collection;
    this.queryName = collection.collectionName;
    this.body = body;
    this.graph = new CollectionNode(
      {
        collection,
        body,
        name: "root",
      },
      context || {}
    );
  }

  /**
   * Retrieves the data.
   *
   * @param context
   * @returns {*}
   */
  public async fetch(): Promise<any[]> {
    this.graph.forceSingleResult = false;
    return this.toArray();
  }

  public async toArray() {
    return hypernova(this.graph);
  }

  public async fetchOne(): Promise<any> {
    this.graph.forceSingleResult = true;
    const results = await this.toArray();

    return _.first(results);
  }
}
