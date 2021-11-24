A small package that brings `ApolloClient` into BlueLibs ecosystem. This is fully decoupled from `X-Framework` meaning it can be integrated in any UI Layer, including React:

## Install

```bash
npm i -S @bluelibs/ui-apollo-bundle
```

```ts
import { Kernel } from "@bluelibs/core";
import { UIApolloBundle } from "@bluelibs/ui-apollo-bundle";

const kernel = new Kernel({
  bundles: [
    new UIApolloBundle({
      client: {
        // ApolloClientOptions<any>;
        uri: "http://localhost:4000/graphql",
      },
      enableSubscriptions: true, // true by default
    }),
  ],
});
```

## Usage in React

We use `@apollo/client` so in theory, all you have to do is just use it. You can [follow the official guideline here](https://www.apollographql.com/docs/react/api/react/hooks/), they will work outside the box without changing anything.

```tsx
import { ApolloClient } from "@bluelibs/ui-apollo-bundle";

function Component() {
  // Note, that we implement our own ApolloClient which extends the base one, so we can properly create the links and everything
  const apolloClient = use(ApolloClient);

  // apolloClient.query({ ... })
  // apolloClient.mutate({ ... })
}
```
