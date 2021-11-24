The purpose of this package is to enable type-safe routing that would allow other bundles to enhance:

## Install

```bash
npm i -S @bluelibs/x-ui-react-bundle @bluelibs/x-ui-react-router-bundle
```

```ts
import { Kernel } from "@bluelibs/core";
import { XUIReactBundle } from "@bluelibs/x-ui-react-bundle";
import { XUIReactRouterBundle } from "@bluelibs/x-ui-react-router-bundle";

const kernel = new Kernel({
  bundles: [new XUIReactBundle(), new XUIReactRouterBundle()],
});
```

## Usage

We add routes through the `XRouter`. Routes are added programatically. Behind the scenes we use `react-router-dom`:

```tsx
import { Bundle } from "@bluelibs/core";

export class UIAppBundle extends Bundle {
  async init() {
    const router = this.container.get(XRouter);

    router.add({
      HOME: {
        path: "/",
        component: () => <h1>Hello world!</h1>,
        // All other properties from react-router-dom can be added here
      },
    });
  }
}
```

:::note
Our strong recommendation is to never rely on strings for routes, this is why we recommend that you use unique constants for their name.
:::

Managing Routes:

```ts title="routes.ts"
export const HOME = {
  path: "/",
  component: () => <h1>Hello world!</h1>,
};

export const USER_VIEW = {
  path: "/users/:_id",
  // Route parameters are injected in the component's props
  component: ({ _id }) => <h1>Hello user {_id}!</h1>,
};

export const SEARCH = {
  path: "/search",
  // Query variables (/search?q=something), are all injected inside `queryVariables` property
  component: ({ queryVariables }) => (
    <h1>You are searching {queryVariables.q}</h1>
  ),
};
```

And now simply add them in your bundle like this:

```ts
import * as Routes from "./routes";

// The function from the Bundle
class UIAppBundle extends Bundle {
  async init() {
    const router = this.container.get(XRouter);

    router.add(Routes);
  }
}
```

Using the link and generating it:

```tsx
import { useRouter } from "@bluelibs/x-ui-router-bundle";
import * as Routes from "{path}/routes.ts";
import { Link } from "react-router-dom";

function Component() {
  // router.path gets you the path
  // router.go also pushes it to history

  const router = useRouter();

  return (
    <div>
      <Link to={router.path(HOME)}>Home Link</Link>
      <button onClick={() => router.go(HOME)}>Take me home</button>
      <Link to={router.path(USER_VIEW, { params: { _id: "123" } })}>
        Parameter Login
      </Link>
      <Link to={router.path(SEARCH, { query: { q: "value" } })}>Home Link</Link>
    </div>
  );
}
```

## Events

Events are very useful when you want to extend the `IRoute` from `@bluelibs/x-ui-router` and you can enhance it, adding things such as `roles` permissions and properly secure your routes, or anything else basically, the idea is that certain route properties can affect how the component is rendered.

```tsx
class UIAppBundle extends Bundle {
  async prepare() {
    this.eventManager.addListener(RoutingPreparationEvent, async (e) => {
      // e.data.routes
    });
  }
}
```
