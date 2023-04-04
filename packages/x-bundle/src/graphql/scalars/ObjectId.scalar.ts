import { GraphQLScalarType } from "graphql";
import { Kind } from "graphql/language";
import { ObjectId } from "@bluelibs/ejson";

export default {
  typeDefs: `scalar ObjectId`,
  resolvers: {
    ObjectId: new GraphQLScalarType({
      name: "ObjectId",
      description: "ObjectId custom scalar type",
      parseValue(value) {
        return new ObjectId(value as string);
      },
      serialize(value: ObjectId) {
        return value.toString();
      },
      parseLiteral(ast) {
        if (ast.kind === Kind.STRING && Boolean(ast.value)) {
          return new ObjectId(ast.value); // ast value is always in string format
        }
        return null;
      },
    }),
  },
};
