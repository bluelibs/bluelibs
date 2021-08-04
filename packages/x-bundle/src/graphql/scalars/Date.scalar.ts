import { GraphQLScalarType } from "graphql";
import { Kind } from "graphql/language";

export default {
  typeDefs: `scalar Date`,
  resolvers: {
    Date: new GraphQLScalarType({
      name: "Date",
      description: "Date Custom scalar type",
      parseValue(value) {
        return new Date(value); // value from the client
      },
      serialize(value) {
        if (!value) {
          return null;
        }

        if (value instanceof Date) {
          return value.getTime();
        }
        if (typeof value === "string") {
          return new Date(value).getTime();
        }

        return value; // value sent to the client
      },
      parseLiteral(ast) {
        if (ast.kind === Kind.INT) {
          return new Date(+ast.value); // ast value is always in string format
        }
        return null;
      },
    }),
  },
};
