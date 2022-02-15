import {
  Service,
  Inject,
  ContainerInstance,
  Constructor,
} from "@bluelibs/core";
import { jsonToGraphQLQuery, VariableType } from "json-to-graphql-query";
import {
  gql,
  FetchPolicy,
  MutationOptions,
  DocumentNode,
} from "@apollo/client/core";
import { EJSON, ObjectId } from "@bluelibs/ejson";
import { IQueryInput, ISubscriptionOptions, QueryBodyType } from "./defs";
import { getSideBody } from "./utils/getSideBody";
import { cleanTypename } from "./utils/cleanTypename";
import { isEmptyObject, toQueryBody } from "./utils/toQueryBody";
import { ApolloClient } from "@bluelibs/ui-apollo-bundle";
import {
  OperationVariables,
  QueryOptions as ApolloQueryOptions,
  QueryResult as ApolloQueryResult,
  useQuery as baseUseQuery,
  useLazyQuery as baseUseLazyQuery,
  QueryTuple,
} from "@apollo/client";

type CompiledQueriesTypes = "Count" | "InsertOne" | "UpdateOne" | "DeleteOne";

type TransformPartial<T> = Partial<{ [key in keyof T]: any }>;

type UpdateFilter<T = any> = {
  [key: string]: any;
};

export type CollectionTransformMap<T> = Partial<{
  [key in keyof T]: (value: any) => any;
}>;

export type CollectionLinkConfig<T> = {
  /**
   * Collection you are related to
   */
  collection: (container) => Constructor<Collection<any>>;
  /**
   * How is this link identified, provide a name that describes the relation
   */
  name: keyof T;
  /**
   * Are you relating to one or many?
   */
  many?: boolean;
  /**
   * Where is the relational data stored?
   */
  field?: keyof T;
};

export type CollectionInputsConfig = {
  insert?: string;
  update?: string;
};

export interface UseQueryOptions {
  apollo: Omit<ApolloQueryOptions, "query">;
}

export interface InsertOneOptions<T> {
  refetchBody?: QueryBodyType<T>;
  apollo?: Omit<MutationOptions, "mutation">;
}

export interface UpdateOneOptions<T> {
  refetchBody?: QueryBodyType<T>;
  apollo?: Omit<MutationOptions, "mutation">;
}

export interface AutoRefetchMutatedFieldsOptions {
  onUpdate: boolean;
  onInsert: boolean;
}

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

  public toQueryBody = toQueryBody;

  protected autoRefetchMutatedFields = {
    onUpdate: true,
    onInsert: true,
  };

  public setAutoRefetchMutatedFields(
    option: boolean | Partial<AutoRefetchMutatedFieldsOptions>
  ) {
    if (typeof option === "boolean") {
      this.autoRefetchMutatedFields.onUpdate = option;
      this.autoRefetchMutatedFields.onInsert = option;
    } else {
      Object.assign(this.autoRefetchMutatedFields, option);
    }
  }

  /**
   * Insert a single document into the remote database
   * @param document
   */
  async insertOne(
    document: Partial<T>,
    options: InsertOneOptions<T> = {}
  ): Promise<Partial<T>> {
    const { apollo = {}, refetchBody = {} as QueryBodyType<T> } = options;

    // If no refetchBody is provided, then infer it from the mutated fields
    if (!isEmptyObject(refetchBody) && this.autoRefetchMutatedFields.onInsert) {
      Object.assign(refetchBody, { ...toQueryBody(document) });
    }

    // @ts-ignore
    if (!refetchBody._id) {
      // @ts-ignore
      refetchBody._id = 1;
    }

    const mutation = this.createInsertMutation(refetchBody);
    const insertInput = this.getInputs().insert || "EJSON!";

    let mutationDocument: string | Partial<T>;
    if (insertInput === "EJSON!") {
      mutationDocument = EJSON.stringify(document);
    } else {
      mutationDocument = Object.assign({}, document);
      this.serialize(mutationDocument);
    }

    return this.apolloClient
      .mutate({
        ...apollo,
        mutation,
        variables: {
          document: mutationDocument,
        },
      })
      .then((response) => {
        return response.data[`${this.getName()}InsertOne`];
      });
  }

  /**
   * Update the document
   * @param _id
   * @param modifier The MongoDB modifiers: @url https://docs.mongodb.com/manual/reference/operator/update/
   */
  async updateOne(
    _id: ObjectId | string,
    update: UpdateFilter<T> | TransformPartial<T>,
    options: UpdateOneOptions<T> = {}
  ): Promise<Partial<T>> {
    const { apollo = {}, refetchBody = {} as QueryBodyType<T> } = options;

    // If no refetchBody is provided, then infer it from the mutated fields
    if (isEmptyObject(refetchBody) && this.autoRefetchMutatedFields.onUpdate) {
      Object.assign(refetchBody, { ...toQueryBody(update) });
    }

    // @ts-ignore
    if (!refetchBody._id) {
      // @ts-ignore
      refetchBody._id = 1;
    }

    const mutation = this.createUpdateMutation(refetchBody);

    const updateType = this.getInputs().update || "EJSON!";
    const isEJSON = updateType === "EJSON!";
    const updateTypeVariable = isEJSON ? "modifier" : "document";

    let updateDocument: TransformPartial<T>;
    if (isEJSON) {
      updateDocument = EJSON.stringify(update);
    } else {
      if (this.isUpdateModifier(update)) {
        updateDocument = update["$set"];
      } else {
        updateDocument = update as TransformPartial<T>;
      }

      updateDocument = Object.assign({}, updateDocument);
      this.serialize(updateDocument);
    }

    return this.apolloClient
      .mutate({
        ...apollo,
        mutation,
        variables: {
          _id,
          [updateTypeVariable]: updateDocument,
        },
      })
      .then((response) => {
        return response.data[`${this.getName()}UpdateOne`];
      });
  }

  /**
   * Delete a single element by _id from database
   * @param _id
   */
  async deleteOne(
    _id: ObjectId | string,
    options?: MutationOptions
  ): Promise<boolean> {
    const mutation = this.createDeleteMutation();

    return this.apolloClient
      .mutate({
        ...options,
        mutation,
        variables: {
          _id,
          document,
        },
      })
      .then((response) => {
        return response.data[`${this.getName()}DeleteOne`];
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

    // Side body is a way to pass nested collection filters, options
    // Gets merged back on the server
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

    const graphqlExecutor = this.compiled.get(compiledQuery);

    if (isMutation) {
      return this.apolloClient
        .mutate({
          mutation: graphqlExecutor,
          variables,
          ...options,
        })
        .then((result) => {
          return result.data[`${this.getName()}${compiledQuery}`];
        });
    }

    return this.apolloClient
      .query({
        query: graphqlExecutor,
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
    if (!body) {
      return this.compiled.get("InsertOne");
    }

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
    if (!body) {
      return this.compiled.get("UpdateOne");
    }

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
    return this.compiled.get("DeleteOne");

    // In case we'll need custom things later
    // const operationName = `${this.getName()}DeleteOne`;

    // const graphQLQuery = {
    //   mutation: {
    //     __name: operationName,
    //     __variables: {
    //       _id: "ObjectId!",
    //     },
    //     [operationName]: {
    //       __args: {
    //         _id: new VariableType("_id"),
    //       },
    //     },
    //   },
    // };

    // return gql(jsonToGraphQLQuery(graphQLQuery));
  }

  /**
   * Integration with native `useQuery` from Apollo, offering a hybrid approach so apollo re-uses your cache.
   * Please note that we also return as data the actual documents and not the main data object.
   *
   * For finding a single element, refer to useQueryOne.
   */
  public useQuery<TVariables = OperationVariables>({
    body = { _id: 1 },
    queryInput,
    options,
  }: {
    body?: QueryBodyType<T> | { _id: number }; // Might be more elegant
    queryInput: IQueryInput<T>;
    options?: UseQueryOptions;
  }): ApolloQueryResult<T[], TVariables> {
    // This is done on every re-render, maybe we could useMemo() some

    const [QUERY, prepareSideBody] = this.createFindQuery(
      false,
      body as QueryBodyType<T>
    );

    // side body used for nested collections filtering
    queryInput = prepareSideBody(queryInput);
    const operation = this.getName() + "Find";

    const result = baseUseQuery<T[], any>(QUERY, {
      ...options,
      query: QUERY,
      variables: {
        query: queryInput,
      },
    });

    if (result?.data) {
      result.data = result.data[operation] || [];
    }

    return result;
  }

  /**
   * Integration with native `useLazyQuery` from Apollo, offering a hybrid approach so apollo re-uses your cache.
   * Please note that we also return as data the actual documents and not the main data object.
   *
   * For finding a single element, refer to useLazyQueryOne.
   */
  public useLazyQuery<TVariables = OperationVariables>({
    body = { _id: 1 },
    queryInput,
    options,
  }: {
    body?: QueryBodyType<T> | { _id: number }; // Might be more elegant
    queryInput: IQueryInput<T>;
    options?: UseQueryOptions;
  }): QueryTuple<T[], TVariables> {
    // This is done on every re-render, maybe we could useMemo() some

    const [QUERY, prepareSideBody] = this.createFindQuery(
      false,
      body as QueryBodyType<T>
    );

    // side body used for nested collections filtering
    queryInput = prepareSideBody(queryInput);

    const lazyQueryTuple = baseUseLazyQuery<T[], any>(QUERY, {
      ...options,
      query: QUERY,
      variables: {
        query: queryInput,
      },
    });

    return lazyQueryTuple;
  }

  /**
   * Integration with native `useQuery` from Apollo, offering a hybrid approach so apollo re-uses your cache.
   */
  public useQueryOne<TVariables = OperationVariables>({
    body = { _id: 1 },
    queryInput,
    options,
  }: {
    body?: QueryBodyType<T> | { _id: number }; // Might be more elegant
    queryInput: IQueryInput<T>;
    options?: UseQueryOptions;
  }): ApolloQueryResult<T, TVariables> {
    // This is done on every re-render, maybe we could useMemo() some

    const [QUERY, prepareSideBody] = this.createFindQuery(
      true,
      body as QueryBodyType<T>
    );

    // side body used for nested collections filtering
    queryInput = prepareSideBody(queryInput);
    const operation = this.getName() + "FindOne";

    const result = baseUseQuery<T, any>(QUERY, {
      ...options,
      query: QUERY,
      variables: {
        query: queryInput,
      },
    });

    if (result?.data) {
      result.data = result.data[operation] || [];
    }

    return result;
  }

  /**
   * Integration with native `useLazyQuery` from Apollo, offering a hybrid approach so apollo re-uses your cache.
   * Please note that we also return as data the actual documents and not the main data object.
   *
   * For finding a single element, refer to useLazyQueryOne.
   */
  public useLazyQueryOne<TVariables = OperationVariables>({
    body = { _id: 1 },
    queryInput,
    options,
  }: {
    body?: QueryBodyType<T> | { _id: number }; // Might be more elegant
    queryInput: IQueryInput<T>;
    options?: UseQueryOptions;
  }): QueryTuple<T[], TVariables> {
    // This is done on every re-render, maybe we could useMemo() some

    const [QUERY, prepareSideBody] = this.createFindQuery(
      true,
      body as QueryBodyType<T>
    );

    // side body used for nested collections filtering
    queryInput = prepareSideBody(queryInput);

    const lazyQueryTuple = baseUseLazyQuery<T[], any>(QUERY, {
      ...options,
      query: QUERY,
      variables: {
        query: queryInput,
      },
    });

    return lazyQueryTuple;
  }

  /**
   * This is used by find() and findOne() to fetch the query
   * @param single
   * @param query
   * @param body
   */
  public createFindQuery<T = null>(
    single: boolean,
    body: QueryBodyType<T>
  ): [DocumentNode, (queryInput: IQueryInput<T>) => IQueryInput<T>] {
    const operationName = this.getName() + (single ? "FindOne" : "Find");

    const graphQLQuery = {
      query: {
        __name: operationName,
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

    const prepare = (queryInput: IQueryInput<T>) => {
      const options = Object.assign({}, queryInput.options);
      const filters = Object.assign({}, queryInput.filters);

      if (options) {
        const sideBody = getSideBody(body);
        if (Object.keys(sideBody).length > 0) {
          options.sideBody = EJSON.stringify(sideBody);
        }
      }

      return {
        filters: filters ? EJSON.stringify(filters) : "{}",
        options: options ?? {},
      };
    };

    const QUERY = gql`
      ${jsonToGraphQLQuery(graphQLQuery, {
        ignoreFields: ["$"],
      })}
    `;

    return [QUERY, prepare];
  }

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
