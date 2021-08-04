import { QueryBodyType, IReducerOption, IQueryContext } from "../../defs";
import { SPECIAL_PARAM_FIELD } from "../../constants";
import { INode } from "./INode";

interface ReducerNodeOptions extends IReducerOption {
  body: QueryBodyType;
}

export default class ReducerNode implements INode {
  public name: string;
  public props: any;
  public isSpread: boolean = false;

  public reduceFunction?: any;
  public pipeline: any[];
  public projection: any;

  // This refers to the graph dependency
  public dependency: QueryBodyType;

  // This is a list of reducer nodes this uses
  public dependencies: ReducerNode[] = [];

  public scheduledForDeletion: boolean = false;

  constructor(
    name,
    options: ReducerNodeOptions,
    public readonly context?: IQueryContext
  ) {
    this.name = name;
    this.reduceFunction = options.reduce;
    this.dependency = options.dependency;
    this.pipeline = options.pipeline || [];
    this.projection = options.projection || {};

    if (!options.projection && !this.reduceFunction) {
      // Projection will be the reducer name
      this.projection = { [name]: 1 };
    }

    this.props = options.body[SPECIAL_PARAM_FIELD] || {};
  }

  /**
   * When computing we also pass the parameters
   *
   * @param {*} object
   * @param {*} args
   */
  public async compute(object) {
    if (!this.reduceFunction) {
      return;
    }

    object[this.name] = await this.reduce.call(this, object, {
      ...this.props,
      context: this.context,
    });
  }

  /**
   * The actual reduce function call
   *
   * @param object
   * @param args
   */
  public async reduce(object, ...args) {
    return this.reduceFunction.call(this, object, ...args);
  }

  /**
   * Adapts the final projection
   * @param projection
   */
  public blendInProjection(projection) {
    if (this.projection) {
      Object.assign(projection, this.projection);
    }
  }

  get hasPipeline() {
    return this.pipeline && this.pipeline.length > 0;
  }
}
