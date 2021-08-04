The GraphQL Bundle is an abstract way to load your Type Definitions, Resolvers, Scalars, Context Transformers/Reducers in a unified place. We made this design choice to be able to hook it with any kind of GraphQL server without making any change to your code. For example, if there's another bundle that instantiates a GraphQL server, you can later swap it for let's say a `serverless` bundle without making any changes to your code.

Besides this loading strategy this bundle comes with:

- Mechanism to automatically load GraphQL files based on file system conventions
- A composition strategy for your resolvers to re-use code

It does automatic type and resolver merging and you can also load context manipulators and schema directives.

## Install

```
npm install --save @bluelibs/graphql-bundle
```

Register it easily:

```ts
kernel.addBundle(new GraphQLBundle());
```

## Usage

```typescript
import { Loader } from "@bluelibs/graphql-bundle";

class AppBundle extends Bundle {
  async init() {
    // Or inside prepare() phase of your Bundle
    const loader = this.container.get(Loader);

    loader.load({
      // Can also be array of strings
      typeDefs: `
        type Query {
          sayHello: String
        }
      `,

      // Can also be array of resolvers
      resolvers: {
        Query: {
          sayHello: () => "Hello world!",
        },
      },

      // Can also be array of objects
      schemaDirectives: {
        name: MyDirective,
      },

      // Can be array of functions, we recommend to name your functions
      // So when it fails you can at least identify easily from where
      contextReducers: async function processNewVariables(context) {
        return {
          ...context,
          newVariable: "newValue",
        };
      },
    });
  }
}
```

## Getting it all together

This would happen when you want to instantiate your server:

```typescript
const {
  typeDefs,
  resolvers,
  schemaDirectives,
  contextReducers,
} = loader.getSchema();
```

## Auto Loading

Given that you store your resolvers in: `resolvers.ts` or in `*.resolvers.ts`, and your types in `*.graphql.ts`, you are able to extract the loading module like this:

```typescript title="graphql/index.ts"
import { extract } from "@bluelibs/graphql-bundle";

// This exports a GraphQL Module, directly laodable via loader.load()
export default extract(__dirname);
```

## Types

```typescript title="graphql/User.graphql.ts"
export default /* GraphQL */ `
  type User {
    firstName: String!
    lastName: String!
    fullName: String!
  }
`;
```

```typescript title="graphql/User.resolvers.ts"
import { IResolverMap } from "@bluelibs/graphql-bundle";

export default {
  User: {
    fullName(user) {
      return user.firstName + " " + user.lastName;
    },
  },
} as IResolverMap; // We are using this so we benefit of autocompletion
```

You also have the ability to store both resolvers and types or things such as context reducers and schema directives. You should use the `*.graphql-module.ts` files:

```typescript title="graphql/User.graphql-module.ts"
import { IResolverMap } from "@bluelibs/graphql-bundle";

export default {
  typeDefs: /* GraphQL */ `
    type Query {
      saySomething: String
    }
  `,
  resolvers: {
    Query: {
      saySomething: () => "Hi!",
    } as IResolverMap,
  },
};
```

## Resolvers

A resolver's job is usually:

- Check if inputs are fine (Validation)
- Check security and permission rights (Authorisation)
- Execute the command delegated to a service (Delegation)
- Manipulate the response to fit the client's request (Response Manipulation)

Let's imagine our resolver, to add a post:

```ts
{
  Mutation: {
    PostAdd(_, args, ctx) {
      // do it
    }
  }
}
```

The function `postAdd` gets transformed to an array of functions:

```ts
{
  Mutation: {
    PostAdd: [
      // Now you can chain functions which are executed in the order here
      (_, args, ctx) => {
        // do things
      },
    ],
  };
}
```

A more concrete example:

```typescript
import { execute } from "@bluelibs/graphql-bundle";

load({
  typeDefs,
  resolvers: {
    Query: {
      PostAdd: [
        async function (_, args, ctx) {
          const postService = ctx.container.get(PostService);
          return postService.addPost(args.post);
        },
      ],
      PostRemove: [
        // These are the plugins
        CheckLoggedIn(),
        CheckPostRights("postId"),
        async (_, args, ctx) => {},
      ],
    },
  },
});
```

## Plugins

A plugin, is a function that returns a resolver function.

Writing the `CheckLoggedIn` plugin:

```typescript
interface ICheckLoggedInConfig {
  errorMessage?: string;
}

const CheckLoggedIn = async function (options: ICheckLoggedInConfig) {
  if (options.errorMessage) {
    options.errorMessage = "User not authorized";
  }

  // This returns a resolver function
  return async function CheckLoggedIn(_, args, ctx) {
    // We assume that if the user is ok, everytime we inject userId into the context
    if (!ctx.userId) {
      throw new Error(options.errorMessage);
    }
  };
};
```

```typescript
export default {
  Query: {
    PostAdd: [
      CheckLoggedIn({ errorMessage: "Not allowed to add post" }),
      async (_, args, ctx) => {
        // Add the post as no exception was thrown
      },
    ],
  },
};
```

## Response Manipulators

You can also write response manipulators, for example your function returns undefined/false, but you want to return a success response:

```typescript
load({
  typeDefs: `
    type Response {
      success: Boolean!
      errorMessage: String
    }
  `,
  resolvers: {
    Query: {
      Something: [() => "something", ManipulateEndResponse()],
    },
  },
});
```

```typescript
import { getResult } from "@bluelibs/graphql-bundle";

const ManipulateEndResponse = () => {
  return async function ManipulateEndResponse(_, args, ctx) {
    // The previous result in the execution pipeline is stored in the context
    // The pipeline, however, will return the response of the last element in the pipeline
    const previousResponse = getResult(ctx);

    // Do whatever
    return {
      success: true,
    };
  };
};
```

## Groups

When you're creating logic you're most likely want to reuse it, this is why we introduce bundling plugins:

```typescript
load({
  typeDefs,
  resolvers: {
    Query: [
      // BEFORE PLUGINS
      [CheckLoggedIn()],

      // EXECUTION MAP
      {
        PostAdd: async (_, args, ctx, x) => {
          const postService = ctx.container.get(PostService);
          return postService.addPost(args.post);
        },

        PostRemove: [
          CheckPostRights("postId"),
          async (_, args, ctx) => {
            // Run check for post rights
          },
        ],
      },

      // AFTER
      [ManipulateEndResponse()],
    ],
  },
});
```

## TypeScript

When we are dealing with a GraphQL resolver, there are 2 things we need types for usually: arguments and context. While context is the same from resolver to resolver, arguments change.

You can have additional context reducers which extend your context, to type them, use the following strategy:

```ts title="defs.ts"
import "@bluelibs/graphql-bundle";

declare module "@bluelibs/graphql-bundle" {
  export interface IGraphQLContext {
    myValue: string;
  }
}
```

For arguments, you either use a generator to transform your GraphQL types into TypeScript. Which can be good but that's an extra process you have to take care of. Usually you would use models that can be validated and the arguments should look like `register(input: RegisterInput!): String`. This is why you can do, in most cases, something like:

```ts title="a sample resolver"
import { InputType } from "@bluelibs/graphql-bundle";

type RegisterInput = {
  myValue: string;
};

function register(_, args: InputType<RegisterInput>, context: IGraphQLContext) {
  const { input } = args;
  // Type safety on input, as it is RegisterInput
}
```
