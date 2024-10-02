import * as _ from "lodash";
import { ClientSession } from "mongodb";
import * as dot from "dot-object";

import {
  SPECIAL_PARAM_FIELD,
  ALIAS_FIELD,
  CONTEXT_FIELD,
} from "../../constants";
import {
  QueryBodyType,
  IReducerOption,
  QuerySubBodyType,
  IQueryContext,
} from "../../defs";

import {
  getLinker,
  getReducerConfig,
  getExpanderConfig,
  hasLinker,
} from "../../api";
import Linker from "../Linker";
import { INode } from "./INode";
import FieldNode from "./FieldNode";
import ReducerNode from "./ReducerNode";
import { Collection, ObjectId } from "mongodb";
import { ALL_FIELDS } from "../../constants";

export interface CollectionNodeOptions {
  collection: Collection<any>;
  body: QueryBodyType;
  explain?: boolean;
  name?: string;
  parent?: CollectionNode;
  linker?: Linker;
}

export enum NodeLinkType {
  COLLECTION,
  FIELD,
  REDUCER,
  EXPANDER,
}

export default class CollectionNode implements INode {
  public body: QuerySubBodyType;
  public name: string;
  public collection: Collection<any>;
  public parent: CollectionNode;
  public alias: string;
  public scheduledForDeletion: boolean = false;

  public nodes: INode[] = [];
  public props: any; // TODO: refator to: ValueOrValueResolver<ICollectionQueryConfig>

  public isVirtual?: boolean;
  public isOneResult?: boolean;

  /**
   * We use session when we're searching through Nova inside a transaction.
   */
  public session?: ClientSession;

  /**
   * When doing .fetchOne() from the Query and forgetting about hard-coding a limit, we should put that limit ourselves to avoid accidentally large queries
   */
  public forceSingleResult: boolean = false;

  /**
   * Whether to just dump the fields without a projection
   */
  public queryAllFields: boolean = false;

  /**
   * When this is true, we are explaining the pipeline, and the given results
   */
  public readonly explain: boolean;

  /**
   * The linker represents how the parent collection node links to the child collection
   */
  public linker: Linker;
  public linkStorageField: string;
  public linkForeignStorageField: string;
  public readonly context: IQueryContext;
  public results: any = [];

  /**
   * This is used for self-referencing expanders
   */
  protected processedExpanders: string[] = [];

  constructor(options: CollectionNodeOptions, context: IQueryContext = {}) {
    const { collection, body, name, parent, linker, explain = false } = options;

    if (collection && !_.isObject(body)) {
      throw new Error(
        `The field "${name}" is a collection link, and should have its body defined as an object.`
      );
    }

    this.context = context;
    this.props = body[SPECIAL_PARAM_FIELD] || {};
    this.alias = body[ALIAS_FIELD];

    if (body[CONTEXT_FIELD]) {
      this.context = Object.assign({}, body[CONTEXT_FIELD], this.context);
    }

    this.queryAllFields = Boolean(body[ALL_FIELDS]);

    this.body = _.cloneDeep(body);
    delete this.body[SPECIAL_PARAM_FIELD];
    delete this.body[ALIAS_FIELD];
    delete this.body[CONTEXT_FIELD];
    delete this.body[ALL_FIELDS];

    this.explain = explain;
    this.name = name;
    this.collection = collection;
    this.parent = parent;

    this.linker = linker;

    if (parent) {
      this.handleSetupForChild();
    }

    // Store the session for transaction if it exists
    if (context.session) {
      this.session = context.session;
    } else {
      if (parent && parent.session) {
        this.session = parent.session;
      }
    }

    this.spread(this.body);
  }

  /**
   * For non-roots,
   */
  private handleSetupForChild() {
    const linker = this.linker;
    const parent = this.parent;

    this.isVirtual = linker.isVirtual();
    this.isOneResult = linker.isOneResult();
    this.linkStorageField = linker.linkStorageField;
    this.linkForeignStorageField = linker.linkForeignStorageField;
    if (this.isVirtual) {
      this.addField(this.linkStorageField, {}, true);
      if (this.linkForeignStorageField !== "_id") {
        parent.addField(this.linkForeignStorageField, {}, true);
      }
    } else {
      parent.addField(this.linkStorageField, {}, true);
      if (this.linkForeignStorageField !== "_id") {
        this.addField(this.linkForeignStorageField, {}, true);
      }
    }
  }

  get collectionNodes(): CollectionNode[] {
    return this.nodes.filter(
      (n) => n instanceof CollectionNode
    ) as CollectionNode[];
  }

  get fieldNodes(): FieldNode[] {
    return this.nodes.filter((n) => n instanceof FieldNode) as FieldNode[];
  }

  get reducerNodes(): ReducerNode[] {
    return this.nodes.filter((n) => n instanceof ReducerNode) as ReducerNode[];
  }

  /**
   * Returns the linker with the field you want
   * @param name {string}
   */
  public getLinker(name: string): Linker {
    if (hasLinker(this.collection, name)) {
      return getLinker(this.collection, name);
    }

    return null;
  }

  public getReducer(name: string): ReducerNode {
    return this.reducerNodes.find((node) => node.name === name);
  }

  public getReducerConfig(name: string): IReducerOption {
    return getReducerConfig(this.collection, name);
  }

  public getExpanderConfig(name: string): QueryBodyType {
    return getExpanderConfig(this.collection, name);
  }

  /**
   * Returns the filters and options needed to fetch this node
   * The argument parentObject is given when we perform recursive fetches
   */
  public getPropsForQuerying(parentObject?: any): {
    filters: any;
    options: any;
    pipeline: any[];
  } {
    let props =
      typeof this.props === "function"
        ? this.props(parentObject)
        : _.cloneDeep(this.props);

    let { filters = {}, options = {}, pipeline = [], decoder } = props;

    if (!this.queryAllFields) {
      options.projection = this.blendInProjection(options.projection);
    }

    if (this.linker) {
      Object.assign(
        filters,
        this.linker.getHardwiredFilters({
          filters,
        })
      );
    }

    return {
      filters,
      options,
      pipeline,
    };
  }

  /**
   * Creates the projection object based on all the fields and reducers
   * @param projection
   */
  public blendInProjection(projection) {
    if (!projection) {
      projection = {};
    }

    this.fieldNodes.forEach((fieldNode) => {
      fieldNode.blendInProjection(projection);
    });

    this.reducerNodes.forEach((reducerNode) => {
      reducerNode.blendInProjection(projection);
    });

    if (!projection._id) {
      projection._id = 1;
    }

    return projection;
  }

  /**
   * @param fieldName
   * @returns {boolean}
   */
  public hasField(fieldName) {
    return this.fieldNodes.find((fieldNode) => fieldNode.name === fieldName);
  }

  /**
   * @param fieldName
   * @returns {FieldNode}
   */
  public getFirstLevelField(fieldName) {
    return this.fieldNodes.find((fieldNode) => {
      return fieldNode.name === fieldName;
    });
  }

  /**
   * @param name
   * @returns {boolean}
   */
  public hasCollectionNode(name) {
    return !!this.collectionNodes.find((node) => {
      return node.name === name;
    });
  }

  /**
   * @param name
   * @returns {boolean}
   */
  public hasReducerNode(name) {
    return !!this.reducerNodes.find((node) => node.name === name);
  }

  /**
   * @param name
   * @returns {ReducerNode}
   */
  public getReducerNode(name) {
    return this.reducerNodes.find((node) => node.name === name);
  }

  /**
   * @param name
   * @returns {CollectionNode}
   */
  public getCollectionNode(name) {
    return this.collectionNodes.find((node) => node.name === name);
  }

  /**
   * Fetches the data accordingly
   */
  public async toArray(additionalFilters = {}, parentObject?: any) {
    const pipeline = this.getAggregationPipeline(
      additionalFilters,
      parentObject
    );

    if (this.explain) {
      console.log(
        `[${this.name}] Pipeline:\n`,
        JSON.stringify(pipeline, null, 2)
      );
    }

    return this.collection
      .aggregate(pipeline, {
        allowDiskUse: true,
        batchSize: 1_000_000,
        session: this.session,
      })
      .toArray();
  }

  /**
   * @param fieldName
   */
  public getLinkingType(fieldName): NodeLinkType {
    if (this.getLinker(fieldName)) {
      return NodeLinkType.COLLECTION;
    }

    if (this.getReducerConfig(fieldName)) {
      return NodeLinkType.REDUCER;
    }

    if (this.getExpanderConfig(fieldName)) {
      return NodeLinkType.EXPANDER;
    }

    return NodeLinkType.FIELD;
  }

  public getFiltersAndOptions(additionalFilters = {}, parentObject?: any) {
    const { filters, options } = this.getPropsForQuerying(parentObject);

    Object.assign(filters, additionalFilters);

    return {
      filters,
      options,
    };
  }

  /**
   * Based on the current configuration fetches the pipeline
   */
  public getAggregationPipeline(
    additionalFilters = {},
    parentObject?: any
  ): any[] {
    const {
      filters,
      options,
      pipeline: pipelineFromProps,
    } = this.getPropsForQuerying(parentObject);

    const pipeline = [];
    Object.assign(filters, additionalFilters);

    if (!_.isEmpty(filters)) {
      pipeline.push({ $match: filters });
    }

    // TODO: transform filters to extract $geoNear, $near and $nearSphere

    pipeline.push(...pipelineFromProps);

    if (options.sort) {
      pipeline.push({ $sort: options.sort });
    }

    this.reducerNodes.forEach((reducerNode) => {
      pipeline.push(...reducerNode.pipeline);
    });

    let limit = options.limit;
    if (this.forceSingleResult) {
      limit = 1;
    }

    if (limit) {
      if (!options.skip) {
        options.skip = 0;
      }
      pipeline.push({
        $limit: limit + options.skip,
      });
    }

    if (options.skip) {
      pipeline.push({
        $skip: options.skip,
      });
    }

    if (options.projection) {
      pipeline.push({
        $project: options.projection,
      });
    }

    return pipeline;
  }

  /**
   * This function creates the children properly for my root.
   */
  protected spread(
    body: QuerySubBodyType,
    fromReducerNode?: ReducerNode,
    scheduleForDeletion?: boolean
  ) {
    _.forEach(body, (fieldBody, fieldName) => {
      if (!fieldBody) {
        return;
      }

      if (fieldName === SPECIAL_PARAM_FIELD || fieldName === ALL_FIELDS) {
        return;
      }

      let alias = fieldName;
      if (fieldBody[ALIAS_FIELD]) {
        alias = fieldBody[ALIAS_FIELD];
        delete fieldBody[ALIAS_FIELD];
      }

      let linkType = this.getLinkingType(alias);

      scheduleForDeletion = fromReducerNode
        ? true
        : Boolean(scheduleForDeletion);

      /**
       * This allows us to have reducer with the same name as the field
       */
      if (fromReducerNode && fromReducerNode.name === fieldName) {
        linkType = NodeLinkType.FIELD;
        scheduleForDeletion = false;
      }

      switch (linkType) {
        case NodeLinkType.COLLECTION:
          if (this.hasCollectionNode(alias)) {
            this.getCollectionNode(alias).spread(
              fieldBody as QueryBodyType,
              null,
              scheduleForDeletion
            );
          } else {
            const linker = this.getLinker(alias);

            const collectionNode = new CollectionNode(
              {
                body: fieldBody as QueryBodyType,
                collection: linker.getLinkedCollection(),
                linker,
                name: fieldName,
                parent: this,
              },
              this.context
            );

            collectionNode.scheduledForDeletion = scheduleForDeletion;

            this.nodes.push(collectionNode);
          }

          break;
        case NodeLinkType.REDUCER:
          if (!this.hasReducerNode(fieldName)) {
            const reducerConfig = this.getReducerConfig(fieldName);

            const reducerNode = new ReducerNode(
              fieldName,
              {
                body: fieldBody as QueryBodyType,
                ...reducerConfig,
              },
              this.context
            );
            reducerNode.scheduledForDeletion = scheduleForDeletion;

            /**
             * This scenario is when a reducer is using another reducer
             */
            if (fromReducerNode) {
              fromReducerNode.dependencies.push(reducerNode);
            }

            this.nodes.push(reducerNode);
          } else {
            // The logic here is that if we specify a reducer in the body, and other reducer depends on it
            // When we spread the body of that other reducer we also need to add it to its deps
            if (fromReducerNode) {
              const reducerNode = this.getReducerNode(fieldName);
              if (
                !fromReducerNode.dependencies.find((n) => n === reducerNode)
              ) {
                fromReducerNode.dependencies.push(reducerNode);
              }
            }
          }

          break;
        case NodeLinkType.EXPANDER:
          // We want to see if this is a self-referencing expander
          // If so we add it to the body
          if (this.processedExpanders.includes(fieldName)) {
            this.addField(fieldName, 1, false);
            break;
          }

          const expanderConfig = this.getExpanderConfig(fieldName);
          _.merge(this.body, expanderConfig);
          if (expanderConfig[fieldName]) {
            // If it contains itself we don't delete it from the body
          } else {
            delete this.body[fieldName];
          }

          this.processedExpanders.push(fieldName);

          this.spread(expanderConfig);
          break;
        case NodeLinkType.FIELD:
          this.addField(fieldName, fieldBody, scheduleForDeletion);
          break;
        default:
          throw new Error(`We could not process the type: ${linkType}`);
      }
    });

    // If by the end of parsing the body, we have no fields, we add one regardless
    if (this.fieldNodes.length === 0 && !this.queryAllFields) {
      const fieldNode = new FieldNode("_id", {});
      this.nodes.push(fieldNode);
    }

    this.blendReducers();
  }

  /**
   *
   * @param fieldName
   * @param body
   * @param scheduleForDeletion
   */
  protected addField(fieldName: string, body, scheduleForDeletion = false) {
    if (this.queryAllFields) {
      return;
    }

    if (fieldName.indexOf(".") > -1) {
      // transform 'profile.firstName': body => { "profile" : { "firstName": body } }
      const newBody = dot.object({ [fieldName]: body });
      fieldName = fieldName.split(".")[0];
      body = newBody[fieldName];
    }

    if (!this.hasField(fieldName)) {
      const fieldNode = new FieldNode(fieldName, body);
      fieldNode.scheduledForDeletion = scheduleForDeletion;

      this.nodes.push(fieldNode);
    } else {
      // In case it contains some sub fields
      const fieldNode = this.getFirstLevelField(fieldName);

      if (
        scheduleForDeletion === false &&
        fieldNode.scheduledForDeletion === true
      ) {
        fieldNode.scheduledForDeletion = false;
      }

      if (fieldNode.subfields.length === 0) {
        console.log("situation", {
          fieldNode,
          body,
          scheduleForDeletion,
        });
        // This is the scenario where you are trying to add "profile.firstName" when "profile" is already added
      } else {
        if (FieldNode.canBodyRepresentAField(body)) {
          if (fieldNode.subfields.length > 0) {
            // We override it, so we include everything
            fieldNode.subfields = [];
          }
        } else {
          fieldNode.spread(body, scheduleForDeletion);
        }
      }
    }
  }

  protected blendReducers() {
    this.reducerNodes
      .filter((node) => !node.isSpread)
      .forEach((reducerNode) => {
        reducerNode.isSpread = true;
        this.spread(reducerNode.dependency, reducerNode, true);
      });
  }

  /**
   * After all data has been cleared up whe begin projection so the dataset is what matches the request body
   */
  public project() {
    this.collectionNodes.forEach((collectionNode) => {
      if (collectionNode.scheduledForDeletion) {
        const field = collectionNode.name;
        for (const result of this.results) {
          delete result[field];
        }
      } else {
        collectionNode.project();
      }
    });
    this.reducerNodes.forEach((reducerNode) => {
      if (reducerNode.scheduledForDeletion) {
        const field = reducerNode.name;
        for (const result of this.results) {
          delete result[field];
        }
      }
    });

    if (this.queryAllFields) {
      return;
    }

    for (const field of this.fieldNodes) {
      field.project(this.results);
    }
  }

  protected hasPipeline() {
    return this.props.pipeline && this.props.pipeline.length > 0;
  }
}
