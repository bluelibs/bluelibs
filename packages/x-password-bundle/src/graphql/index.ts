import { ILoadOptions } from "@bluelibs/graphql-bundle";
import mutationsResolversCreator from "./mutations.resolvers";
import mutationsTypeDefsCreator from "./mutations.graphql";
import queriesResolversCreator from "./queries.resolvers";
import queriesTypeDefsCreator from "./queries.graphql";
import { IXPasswordBundleConfig } from "../defs";

export function createGraphQLModule(
  config: IXPasswordBundleConfig
): ILoadOptions {
  const typeDefs = [];
  const resolvers = [];

  const queriesTypeDefs = queriesTypeDefsCreator(config);
  const queriesResolvers = queriesResolversCreator(config);

  const mutationsTypeDefs = mutationsTypeDefsCreator(config);
  const mutationsResolvers = mutationsResolversCreator(config);

  if (queriesTypeDefs !== "") {
    typeDefs.push(queriesTypeDefs);
    resolvers.push(queriesResolvers);
  }
  if (mutationsTypeDefs !== "") {
    typeDefs.push(mutationsTypeDefs);
    resolvers.push(mutationsResolvers);
  }
  return {
    typeDefs,
    resolvers,
  };
}
