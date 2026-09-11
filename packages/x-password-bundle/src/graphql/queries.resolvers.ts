import * as X from "@bluelibs/x-bundle";
import { IXPasswordBundleConfig } from "../defs";
import { IFunctionMap, IGraphQLContext } from "@bluelibs/graphql-bundle";
import { ContainerInstance } from "@bluelibs/core";
import { UserId } from "@bluelibs/security-bundle";
import {
  UsersCollection,
  USERS_COLLECTION_TOKEN,
} from "@bluelibs/security-mongo-bundle";

export default (config: IXPasswordBundleConfig) => {
  const {
    graphql: { queries },
  } = config;

  const resolvers: IFunctionMap = {};

  if (queries.me) {
    resolvers.me = [
      X.CheckLoggedIn(),
      (
        _,
        args,
        context: IGraphQLContext & {
          container: ContainerInstance;
          userId: UserId;
        },
        ast
      ) => {
        const { userId, container } = context;

        // why: the user model is extended with app-specific fields (fullName, profile, ...) beyond IUser
        const usersCollection = container.get<UsersCollection<any>>(
          USERS_COLLECTION_TOKEN
        );

        return usersCollection.queryOneGraphQL<any>(ast, {
          filters: {
            _id: userId,
          },
          intersect: {
            _id: 1,
            // @ts-ignore
            email: 1,
            fullName: 1,
            roles: 1,
            profile: 1,
          },
        });
      },
    ];
  }

  return {
    Query: resolvers,
  };
};
