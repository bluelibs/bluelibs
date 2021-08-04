import GraphQLJSON, { GraphQLJSONObject } from "graphql-type-json";

export default {
  typeDefs: `
    scalar JSON
    scalar JSONObject
  `,
  resolvers: {
    JSON: GraphQLJSON,
    JSONObject: GraphQLJSONObject,
  },
};
