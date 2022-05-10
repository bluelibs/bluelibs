## Install

```bash
npm i -S graphql @bluelibs/graphql-bundle apollo-server-express @bluelibs/apollo-bundle
```

```ts
import { ApolloBundle } from "@bluelibs/apollo-bundle";

const kernel = new Kernel({
  bundles: [new GraphQLBundle(), new ApolloBundle()],
});
```

## Purpose

Apollo is the current leader on `Node` in terms of implementing GraphQL for the server, their tooling is fantastic and we can use it seamlessly. There are various server implementations that exist: `koa`, `lambda` (serverless). We are using the standard one alongside with `express` which enables us to also add additional routes.

However, keep in mind, that this strategy allows you to easily `swap` servers without performing modifications to your code, since the definitions are loaded separately through the `GraphQLBundle`.

The integration provides you with:

- Access to `container` from the GraphQL Context
- Express app for custom routes (webhooks, downloads, etc)
- Subscription Support
- JIT compilation of your GraphQL supercharging the speeds.

The `express` application and `ApolloServer` are created in the `KernelAfterInit` event. So, in essence, server starts when all bundles have been successfully initialised.

## Usage

```typescript
import { ApolloBundle } from "@bluelibs/apollo-bundle";

kernel.addBundle(
  new ApolloBundle({
    // (optional) The port it starts on
    port: 4000,

    // (optional) This is more on the informative side, to explicitly state the final endpoint of your app
    url: "http://localhost:4000",

    // (optional) Apollo additional configuration
    apollo: ApolloServerExpressConfig,

    // (optional) Whether to install websocket handlers
    enableSubscriptions: false,

    // (optional) Express middlewares:
    middlewares: [],

    // (optional) Server Side Routes
    // You can also add them from your bundle via `.addRoute()`
    routes: [
      {
        type: "post", // "get", "put", "all"
        path: "/api/payment-handler/:orderId",
        handler: async (container, req, res) => {},
        // These are optional and used for body-parsing
        json: true,
        urlencoded: true,
      },
    ],

    // Use uploads: false if you want to disable support for file uploading via graphql-upload
    uploads: {
      maxFileSize: 1024 * 1024 * 1000, // 1000 mega bytes, default is 10e9
      maxFiles: 10, // how many files can a user upload at once?
    },

    // Enables/disables JIT decoding for GRAPHQL
    jit: true,
  })
);
```

## Loading API Definitions

```typescript
import { Bundle } from "@bluelibs/core";
import { Loader } from "@bluelibs/graphql-bundle";

class AppBundle extends Bundle {
  prepare() {
    const loader = this.get<Loader>(Loader);

    loader.load({
      typeDefs: `
        type Query {
          sayHello: String
        }
      `,
      resolvers: {
        Query: {
          sayHello: (_, args, ctx) => {
            // You have access to the kernel container via: ctx.container
            return "Hello world!";
          },
        },
      },
      contextReducers: async function storeUser(ctx) {
        // Note that if you have subscriptions enabled
        // You'll have to read from connectionParams rather than req and manually identify whether its HTTP vs Subscription
        return {
          ...ctx,
          userId: "XXX",
        };
      },
    });
  }
}
```

## Internals

```ts
import { ApolloBundle } from "@bluelibs/apollo-bundle";

class AppBundle extends Bundle {
  async prepare() {
    const apolloBundle = this.container.get(ApolloBundle);

    // Express App
    apolloBundle.app;

    // Node HTTP Server from 'http'
    apolloBundle.httpServer;

    // ApolloServer instance
    apolloBundle.server;

    // Subscription service (if they are enabled)
    apolloBundle.subscriptionServer;
  }
}
```

## Playground

If you want to benefit of the built-in playground for Apollo we recommend you do this:

```ts
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";

new ApolloBundle({
  apollo: {
    plugins: [
      ApolloServerPluginLandingPageGraphQLPlayground({
        /* options */
      }),
    ],
  },
});
```

## Serverless

There is a wide sea of applications when it comes to serverless. We offer full support for Apollo Lambda Serverless.

Install the following dependencies:

```bash
npm i -g serverless # In case you haven't installed it
npm i -D @bluelibs/serverless-plugin-typescript serverless-offline
```

You have to configure the following, in your handler:

```ts title="src/startup/serverless.ts"
import "./bundles";
import { kernel } from "./kernel";
import { createServerlessHandler } from "@bluelibs/apollo-bundle";

export const graphqlHandler = createServerlessHandler(kernel);
```

Now let's configure `serverless.yml` file:

```yml
# serverless.yml
service: apollo-lambda
plugins:
  - "@bluelibs/serverless-plugin-typescript"
  - serverless-offline

provider:
  name: aws
  runtime: nodejs14.x
functions:
  graphql:
    # this is formatted as <FILENAME>.<HANDLER>
    handler: src/startup/serverless.graphqlHandler
    maximumEventAge: 7200
    maximumRetryAttempts: 1
    events:
      - http:
          path: /
          method: post
          cors: true
      - http:
          path: /
          method: get
          cors: true
```

Now you can execute it by following instructions on serverless, to test locally:

```bash
serverless offline start --noPrependStageInUrl
```

If you are using `GraphQL Playground`, keep in mind that serverless restarts the Kernel everytime, therefore if you are looking for some logs and less output, you have to stop automatic schema polling (it's next to the URL if you're using the hosted version of Apollo Playground)

## Meta

### Summary

Easy to use `ApolloServer` for your BlueLibs Application that contains lots of great stuff but also gives you the ability to fully customise `ApolloServer`.

### Boilerplates

- [ApolloBundle](https://stackblitz.com/edit/node-cbokfp?file=src%2Fapollo%2Findex.ts)
  - Use `/graphql` in the render part to access GraphQL Playground and run a query: `getUsers { name }`

### Challenges

- Create a JWT user authentication mechanism that reads from the request headers and puts the userId in the context (3p)
- Create an easy subscription system which triggers an event every second (2p)
- Create a mutation in which you upload a text file and as a response gives you its contents (1p)
