// Part of this code has been taken from:
// https://github.com/taion/graphql-type-json
// Commit: 228b58f8e34a3e941198cadb7785b92dc64e01d6

import { GraphQLScalarType, ValueNode } from "graphql";
import { Kind, print } from "graphql/language";
import { EJSON } from "@bluelibs/ejson";

// function parseObject(typeName, ast, variables) {
//   const value = Object.create(null);
//   ast.fields.forEach((field) => {
//     // eslint-disable-next-line no-use-before-define
//     value[field.name.value] = parseLiteral(typeName, field.value, variables);
//   });

//   return value;
// }
// function parseLiteral(typeName, ast, variables) {
//   switch (ast.kind) {
//     case Kind.STRING:
//     case Kind.BOOLEAN:
//       return ast.value;
//     case Kind.INT:
//     case Kind.FLOAT:
//       return parseFloat(ast.value);
//     case Kind.OBJECT:
//       return parseObject(typeName, ast, variables);
//     case Kind.LIST:
//       return ast.values.map((n) => parseLiteral(typeName, n, variables));
//     case Kind.NULL:
//       return null;
//     case Kind.VARIABLE:
//       return variables ? variables[ast.name.value] : undefined;
//     default:
//       throw new TypeError(`${typeName} cannot represent value: ${print(ast)}`);
//   }
// }

// This named export is intended for users of CommonJS. Users of ES modules
//  should instead use the default export.
export const GraphQLEJSON = new GraphQLScalarType({
  name: "EJSON",
  description:
    "The `EJSON` scalar type represents EJSON values as specified by [Meteor EJSON](https://docs.meteor.com/api/ejson.html).",
  serialize: (value) => {
    return EJSON.stringify(value);
  },
  parseValue: (value) => {
    if (typeof value === "object") {
      return EJSON.fromJSONValue(value);
    }

    return EJSON.parse(value);
  },
  parseLiteral(valueNode) {
    if (valueNode.kind === Kind.STRING) {
      return EJSON.parse(valueNode.value);
    }
  },
});

export default {
  typeDefs: `
    scalar EJSON
  `,
  resolvers: {
    EJSON: GraphQLEJSON,
  },
};
