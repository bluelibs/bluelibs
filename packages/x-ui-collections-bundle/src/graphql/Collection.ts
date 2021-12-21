import {
  Service,
  Inject,
  ContainerInstance,
  Constructor,
} from "@bluelibs/core";
import { jsonToGraphQLQuery, VariableType } from "json-to-graphql-query";
import { gql, DocumentNode, FetchPolicy } from "@apollo/client/core";
import { EJSON, ObjectId } from "@bluelibs/ejson";
import { MongoFilterQuery, QueryBodyType } from "./defs";
import { getSideBody } from "./utils/getSideBody";
import { cleanTypename } from "./utils/cleanTypename";
import { ApolloClient, IEventsMap } from "@bluelibs/ui-apollo-bundle";

type CompiledQueriesTypes = "Count" | "InsertOne" | "UpdateOne" | "DeleteOne";

type TransformPartial<T> = Partial<{ [key in keyof T]: any }>;

type UpdateFilter<T = any> = {
  [key: string]: any;
};

export type CollectionTransformMap<T> = Partial<{
  [key in keyof T]: (value: any) => any;
}>;

export type CollectionLinkConfig<T> = {
  collection: (container) => Constructor<Collection>;
  name: keyof T;
  many?: boolean;
  field?: keyof T;
};

export type CollectionInputsConfig = {
  insert?: string;
  update?: string;
};

@Service()
export abstract class Collection<T = null> {
  compiled = new Map<CompiledQueriesTypes, DocumentNode>();

  constructor(
    @Inject(() => ApolloClient)
    protected readonly apolloClient: ApolloClient,
    @Inject()
    protected readonly container: ContainerInstance
  ) {
    this.setupQueries();
  }

  abstract getName(): string;

  getInputs(): CollectionInputsConfig {
    return {};
  }

  /**
   * Returns a simple map, and for each field you provide a function which transforms it
   */
  getTransformMap(): CollectionTransformMap<T> {
    return {};
  }

  /**
   * Returns a simple map, and for each field you provide a function which serialize it to send it via insert or update
   * This is designed when you have custom inputs
   * Typically you would do this for date and objectId fields to transform them to a string or number.
   */
  getSerializeMap(): CollectionTransformMap<T> {
    return {};
  }

  /**
   * Returns the relations it has with other classes. Might mimick the server, but not necessarily.
   */
  getLinks(): CollectionLinkConfig<T>[] {
    return [];
  }

  /**
   * Transforms the document based on getTransformMap() and getLinks().
   *
   * @mutates
   * @param values
   */
  transform(values: TransformPartial<T> | TransformPartial<T>[]): void {
    if (!Array.isArray(values)) {
      values = [values];
    }

    this.doTransform(values, this.getTransformMap());
  }

  /**
   * This function mutates the documents. Be careful when using it, feel free to clone your data before hand.
   *
   * @mutates
   * @param values
   */
  serialize(values: TransformPartial<T> | TransformPartial<T>[]): void {
    if (!Array.isArray(values)) {
      values = [values];
    }

    return this.doTransform(values, this.getSerializeMap());
  }

  /**
   * This does the transformation by reading the transform map and also reading through fields
   * We decided to work with arrays to mitigate ContainerInstance abuse when dealing with many documents and relations
   * @param documents
   */
  protected doTransform(
    documents: TransformPartial<T>[],
    map: CollectionTransformMap<T>
  ): void {
    for (const document of documents) {
      if (!document) {
        continue;
      }
      for (const field in map) {
        if (document[field] !== undefined) {
          document[field] = map[field](document[field]);
        }
      }
    }

    for (const relation of this.getLinks()) {
      const collection = this.container.get(
        relation.collection(this.container)
      );

      for (const value of documents) {
        if (!value) {
          continue;
        }
        if (value[relation.field]) {
          if (relation.many) {
            value[relation.field] = value[relation.field].map(
              (v) => new ObjectId(v)
            );
          } else {
            value[relation.field] = new ObjectId(value[relation.field]);
          }
        } else if (relation.field in value) {
          // We should automatically fill it with defaults
          if (relation.many) {
            value[relation.field] = [];
          } else {
            value[relation.field] = null;
          }
        }

        if (value[relation.name]) {
          collection.transform(value[relation.name]);
        }
      }
    }
  }

  /**
   * Insert a single document into the remote database
   * @param document
   */
  async insertOne(document: Partial<T>): Promise<Partial<T>> {
    const insertInput = this.getInputs().insert || "EJSON!";

    if (insertInput === "EJSON!") {
      return this.runCompiledQuery("InsertOne", {
        document: EJSON.stringify(document),
      });
    } else {
      const newDocument = Object.assign({}, document);
      this.serialize(newDocument);

      return this.runCompiledQuery("InsertOne", {
        document: newDocument,
      });
    }
  }

  /**
   * Update the document
   * @param _id
   * @param modifier The MongoDB modifiers: @url https://docs.mongodb.com/manual/reference/operator/update/
   */
  async updateOne(
    _id: ObjectId | string,
    modifier: UpdateFilter<T> | TransformPartial<T>
  ): Promise<Partial<T>> {
    const updateInput = this.getInputs().update || "EJSON!";

    if (updateInput === "EJSON!") {
      return this.runCompiledQuery("UpdateOne", {
        _id,
        modifier: EJSON.stringify(modifier),
      });
    } else {
      let document: TransformPartial<T>;
      if (this.isUpdateModifier(modifier)) {
        document = modifier["$set"];
      } else {
        document = modifier;
      }
      const newDocument = Object.assign({}, document);
      this.serialize(newDocument);

      return this.runCompiledQuery("UpdateOne", {
        _id,
        document: newDocument,
      });
    }
  }

  /**
   * Delete a single element by _id from database
   * @param _id
   */
  async deleteOne(_id: ObjectId | string): Promise<boolean> {
    return this.runCompiledQuery("DeleteOne", {
      _id,
    });
  }

  /**
   * Find documents directly from the database
   * @param query
   * @param body
   */
  async find(
    query: IQueryInput,
    body: QueryBodyType<T>
  ): Promise<Partial<T[]>> {
    return this.hybridFind(false, query, body);
  }

  /**
   * Finds and returns a single element
   * @param query
   * @param body
   */
  async findOne(
    query: IQueryInput,
    body: QueryBodyType<T>
  ): Promise<Partial<T>> {
    return this.hybridFind(true, query, body);
  }

  /**
   * Finds and returns a single element
   * @param query
   * @param body
   */
  async findOneById(
    _id: ObjectId | string,
    body: QueryBodyType<T>
  ): Promise<Partial<T>> {
    if (typeof _id === "string") {
      _id = new ObjectId(_id);
    }

    return this.hybridFind(true, { filters: { _id } }, body);
  }

  /**
   * This simply returns a zen observable that reads messages.
   * XSubscription is the model that handles the dataSet
   * @param body
   * @param options
   */
  subscribe(body: QueryBodyType<T>, options: ISubscriptionOptions = {}) {
    const subscriptionName =
      options.subscription || `${this.getName()}Subscription`;

    return this.apolloClient.subscribe({
      query: gql`
        subscription ${subscriptionName}($body: EJSON) {
          ${subscriptionName}(body: $body) {
            event
            document
          }
        }
      `,
      variables: {
        body: EJSON.stringify(body),
      },
    });
  }

  /**
   * Counts the elements from the database
   * @param filters
   */
  async count(filters: any): Promise<number> {
    return this.runCompiledQuery("Count", {
      query: {
        filters: EJSON.stringify(filters),
      },
    });
  }

  /**
   * Returns the fetch policy for all queries (find/findOne/count)
   */
  getFetchPolicy(): FetchPolicy {
    return "network-only";
  }

  /**
   * This is used by find() and findOne() to fetch the query
   * @param single
   * @param query
   * @param body
   */
  protected hybridFind(
    single: boolean,
    queryInput: IQueryInput,
    body: QueryBodyType
  ): Promise<any> {
    const operationName = this.getName() + (single ? "FindOne" : "Find");

    const graphQLQuery = {
      query: {
        __variables: {
          query: "QueryInput!",
        },
        [operationName]: Object.assign({}, body, {
          __args: {
            query: new VariableType("query"),
          },
        }),
      },
    };

    if (queryInput?.options) {
      const sideBody = getSideBody(body);
      if (Object.keys(sideBody).length > 0) {
        queryInput.options.sideBody = EJSON.stringify(sideBody);
      }
    }

    return this.apolloClient
      .query({
        query: gql`
          ${jsonToGraphQLQuery(graphQLQuery, {
            ignoreFields: ["$"],
          })}
        `,
        variables: {
          query: {
            filters: queryInput.filters
              ? EJSON.stringify(queryInput.filters)
              : "{}",
            options: queryInput.options ?? {},
          },
        },
        fetchPolicy: this.getFetchPolicy(),
      })
      .then((result) => {
        const data = JSON.parse(JSON.stringify(result.data[operationName]));
        try {
          // We do this so we can easily use documents without stripping typename every time
          cleanTypename(data, body);
          this.transform(data);
        } catch (err) {
          console.error(err);
        }

        return data;
      });
  }

  /**
   * This function is used to execute a compiled query and return the promise as value
   * @param compiledQuery
   * @param variables
   * @param options
   */
  protected runCompiledQuery(
    compiledQuery: CompiledQueriesTypes,
    variables,
    options = {}
  ) {
    const isMutation = ["InsertOne", "UpdateOne", "DeleteOne"].includes(
      compiledQuery
    );

    if (isMutation) {
      return this.apolloClient
        .mutate({
          mutation: this.compiled.get(compiledQuery),
          variables,
          ...options,
        })
        .then((result) => {
          return result.data[`${this.getName()}${compiledQuery}`];
        });
    }

    return this.apolloClient
      .query({
        query: this.compiled.get(compiledQuery),
        variables,
        fetchPolicy: this.getFetchPolicy(),
        ...options,
      })
      .then((result) => {
        return result.data[`${this.getName()}${compiledQuery}`];
      });
  }

  /**
   * Used for creating an customisable insertion query with type-safe fetching.
   *
   * @param body
   * @returns
   */
  createInsertMutation(body?: QueryBodyType<T>): DocumentNode {
    const insertType = this.getInputs().insert || "EJSON!";
    const operationName = `${this.getName()}InsertOne`;

    const graphQLQuery = {
      mutation: {
        __name: operationName,
        __variables: {
          document: insertType,
        },
        [operationName]: Object.assign({}, body, {
          __args: {
            document: new VariableType("document"),
          },
        }),
      },
    };

    return gql(jsonToGraphQLQuery(graphQLQuery));
  }

  /**
   * Used for creating an customisable insertion query with type-safe fetching.
   *
   * @param body
   * @returns
   */
  createUpdateMutation(body?: QueryBodyType<T>): DocumentNode {
    const updateType = this.getInputs().update || "EJSON!";
    const operationName = `${this.getName()}UpdateOne`;

    const updateTypeVariable =
      updateType === "EJSON!" ? "modifier" : "document";

    const graphQLQuery = {
      mutation: {
        __name: operationName,
        __variables: {
          _id: "ObjectId!",
          [updateTypeVariable]: updateType,
        },
        [operationName]: Object.assign({}, body, {
          __args: {
            _id: new VariableType("_id"),
            [updateTypeVariable]: new VariableType(updateTypeVariable),
          },
        }),
      },
    };

    return gql(jsonToGraphQLQuery(graphQLQuery));
  }

  /**
   * Provides the DocumentNode to use with variable: "_id"
   *
   * @param body
   * @returns
   */
  createDeleteMutation(): DocumentNode {
    const operationName = `${this.getName()}DeleteOne`;

    const graphQLQuery = {
      mutation: {
        __name: operationName,
        __variables: {
          _id: "ObjectId!",
        },
        [operationName]: {
          __args: {
            _id: new VariableType("_id"),
          },
        },
      },
    };

    return gql(jsonToGraphQLQuery(graphQLQuery));
  }

  // createFindQuery(): [DocumentNode, prepareQueryVariables] {

  // }

  /**
   * This compiles the queries so they aren't created each time.
   */
  protected setupQueries() {
    // Mutations
    const insertType = this.getInputs().insert || "EJSON!";

    this.compiled.set(
      "InsertOne",
      gql`
        mutation ${this.getName()}InsertOne($document: ${insertType}) {
          ${this.getName()}InsertOne(document: $document) {
            _id
          }
        }
      `
    );

    const updateType = this.getInputs().update || "EJSON!";
    const updateTypeVariable =
      updateType === "EJSON!" ? "modifier" : "document";
    const $updateTypeVariable = "$" + updateTypeVariable;

    // Might look a bit confusing the idea is that if we're in EJSON we treat it as a modifier {$set: {}}
    this.compiled.set(
      "UpdateOne",
      gql`
        mutation ${this.getName()}UpdateOne($_id: ObjectId!, ${$updateTypeVariable}: ${updateType}) {
          ${this.getName()}UpdateOne(_id: $_id, ${updateTypeVariable}: ${$updateTypeVariable}) {
            _id
          }
        }
      `
    );

    this.compiled.set(
      "DeleteOne",
      gql`
        mutation ${this.getName()}DeleteOne($_id: ObjectId!) {
          ${this.getName()}DeleteOne(_id: $_id)
        }
      `
    );

    this.compiled.set(
      "Count",
      gql`
        query ${this.getName()}Count($query: QueryInput) {
          ${this.getName()}Count(query: $query)
        }
      `
    );
  }

  protected isUpdateModifier(element: any): element is UpdateFilter<T> {
    return element["$set"];
  }
}

export interface IQueryInput<T = null> {
  /**
   * MongoDB Filters
   * @url https://docs.mongodb.com/manual/reference/operator/query/
   */
  filters?: T extends null
    ? {
        [key: string]: any;
      }
    : MongoFilterQuery<T>;
  /**
   * MongoDB Options
   */
  options?: IQueryOptionsInput;
}

export interface ISubscriptionOptions extends IEventsMap {
  subscription?: string;
}

export interface IQueryOptionsInput {
  sort?: {
    [key: string]: any;
  };
  limit?: number;
  skip?: number;
  sideBody?: QueryBodyType;
}
