import * as X from "../../../";
import { IGraphQLContext, IResolverMap } from "@bluelibs/graphql-bundle";
import { PostsCollection } from "./collections";
import { PasswordService } from "@bluelibs/password-bundle";
import { SecurityService } from "@bluelibs/security-bundle";

export default {
  Query: [
    [
      X.Secure([
        {
          match: X.Secure.Match.Roles("ADMIN"),
        },
        {
          match: X.Secure.Match.Roles("PROJECT_MANAGER"),
          run: [
            X.Secure.Intersect({
              title: 1,
              description: 1,
              private: 1,
            }),
            X.Secure.ApplyNovaOptions({
              filters: {
                private: { $ne: true },
              },
            }),
          ],
        },
      ]),
    ],
    {
      PostsFindOne: [X.ToNovaOne(PostsCollection)],
      PostsFind: [X.ToNova(PostsCollection)],
      PostsCount: [X.ToCollectionCount(PostsCollection)],
    },
  ],
  Mutation: [
    [],
    {
      async login(_, args, ctx: IGraphQLContext): Promise<{ token: string }> {
        const passwordService = ctx.container.get(PasswordService);
        const securityService = ctx.container.get(SecurityService);

        const { input } = args;
        const userId = await passwordService.findUserIdByUsername(
          input.username
        );

        const isValid = await passwordService.isPasswordValid(
          userId,
          input.password
        );

        if (!isValid) {
          throw new Error("invalid credentials");
        }

        const token = await securityService.login(userId, {
          authenticationStrategy: passwordService.method,
        });

        return { token };
      },
      PostsInsertOne: [
        X.ToDocumentInsert(PostsCollection),
        X.ToNovaByResultID(PostsCollection),
      ],
      PostsUpdateOne: [
        X.Secure([
          {
            match: X.Secure.Match.Roles("ADMIN"),
          },
          {
            run: [X.Secure.IsUser(PostsCollection, "ownerId", "_id")],
          },
        ]),
        X.CheckDocumentExists(PostsCollection),
        X.ToDocumentUpdateByID(PostsCollection, null, ({ document }) => ({
          $set: document,
        })),
        X.ToNovaByResultID(PostsCollection),
      ],
      PostsDeleteOne: [
        X.Secure([
          {
            match: X.Secure.Match.Roles("ADMIN"),
          },
          {
            run: [X.Secure.IsUser(PostsCollection, "ownerId", "_id")],
          },
        ]),
        X.CheckDocumentExists(PostsCollection),
        X.ToDocumentDeleteByID(PostsCollection),
      ],
    },
  ],
} as IResolverMap;
