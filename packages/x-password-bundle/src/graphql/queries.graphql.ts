import { IXPasswordBundleConfig } from "../defs";

function query(type: string, queryLine: string, others: string = "") {
  return (type += "\n type Query {\n" + queryLine + "\n }\n" + others + "\n");
}

export default (config: IXPasswordBundleConfig) => {
  const {
    graphql: { queries },
  } = config;

  let output = "";

  if (queries.me) {
    output = query(output, /* GraphQL */ `me: User!`);
  }

  return output;
};
