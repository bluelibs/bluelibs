<h1 align="center">BlueLibs APOLLO SECURITY BUNDLE</h1>

[![npm version](https://badge.fury.io/js/%40bluelibs%2Fapollo-security-bundle.svg)](https://badge.fury.io/js/%40bluelibs%2Fapollo-security-bundle)
[![CI](https://github.com/bluelibs/bluelibs/actions/workflows/lint-and-test.yml/badge.svg)](https://github.com/bluelibs/bluelibs/actions/workflows/lint-and-test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This bundle is to inject into the context the token read from the request and decoded to an userId via the SecurityBundle.

## Installation

```bash
npm i -S @bluelibs/apollo-bundle @bluelibs/apollo-security-bundle
```

```typescript
import { ApolloSecurityBundle } from "@bluelibs/apollo-security-bundle";

kernel.addBundle(
  new ApolloSecurityBundle({
    // options go here
  })
);
```

Options:

```js
export interface IApolloSecurityBundleConfig {
  // All true by default
  support: {
    headers?: boolean,
    cookies?: boolean,
    websocket?: boolean,
  };
  // bluelibs-token is the default for all
  identifiers: {
    headers?: string,
    cookies?: string,
    // For websocket you have to send the connection params in order to work
    websocket?: string,
  };
}
```

Usage:

```js
import { ISecurityContext } from "@bluelibs/apollo-security-bundle";

load({
  resolvers: {
    Query: {
      findMyPosts(_, args, context: ISecurityContext) {
        if (!context.userId) {
          // You can throw an error.
        }
      },
    },
  },
});
```

## Support

This package is part of [BlueLibs](https://www.bluelibs.com) family. If you enjoy this work please show your support by starring [the main package](https://github.com/bluelibs/bluelibs). If not, let us know what can we do to deserve it, [our feedback form is here](https://forms.gle/DTMg5Urgqey9QqLFA)
