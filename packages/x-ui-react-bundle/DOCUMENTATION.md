With the React bundle we hook the [Foundation Core](/docs/package-core) into React giving us ability to have Dependency Injection and a common ecosystem of module administration on the frontend.

## Usage

We begin by defining our kernel, and our `UIAppBundle`:

```tsx title="kernel.ts"
import { Kernel, Bundle } from "@bluelibs/core";
import { XUIReactBundle } from "@bluelibs/x-ui-react-bundle";

// All UI bundles need to be prefixed with UI
// All X-Framework bundles have the first prefix X
export const kernel = new Kernel({
  bundles: [
    new XUIReactBundle({
      // While the kernel is loading show a specific loader
      initialisingComponent: AppLoadingComponent;
    }),
  ],
});
```

In order to render we'll use `XUIProvider` with the kernel as a property:

```tsx
import { kernel } from "./kernel";
import { XUIProvider } from "@bluelibs/x-ui-react-bundle";
import React from "react";
import ReactDOM from "react-dom";

ReactDOM.render(
  <XUIProvider kernel={kernel} />,
  document.getElementById("root")
);
```

## Dependency Injection

We brough [Dependency Injection](/docs/package-core#dependency-injection) into React and it's great. While it feels a little bit of over-engineering at first, the advantages are immediately seen:

```ts
import { Service, Inject } from "@bluelibs/core";
import { ApolloClient, useContainer, useRouter, use } from "@bluelibs/x-ui";

@Service()
class API {
  @Inject("apiHost")
  apiHost: string;
}

function Component() {
  // Gets the main `ContainerInstance` of the kernel.
  const container = useContainer();

  // You fetch the singleton instance of A
  const api = use(API);
}
```

Results are automatically memo-ized unless you specify `transient: true`, especially when you use transient services (services which instantiate everytime you get them from the container)

```ts
function Component() {
  // On every re-render form will be fetched
  const form = use(FormClass, { transient: true });

  // If you want transience once, not on every rerender, use `useMemo()`
}
```

This gives us the ability to have configurable logic across the whole react application. Giving you the ability to modify your app and create re-usable modules which can be modified through DI to do what you need.

## UI Components

Imagine an application where every component you see is "swappable" and everything remains type-safe. This is quite possible with our mechanism of `UIComponents`:

```ts
function Component() {
  const UIComponents = useUIComponents();

  return <UIComponents.Loading />;
}
```

### Override

Overriding them can be done in the `init()` phase of your bundle:

```ts
import { Bundle } from "@bluelibs/core";
import { XUIReactBundle } from "@bluelibs/x-ui-react-bundle";

class UIAppBundle extends Bundle {
  async init() {
    const xuiReactBundle = this.container.get(XUIReactBundle);

    xuiReactBundle.updateUIComponents({
      Loading: MyLoadingComponent,
    });
    // Now everywhere it's used it will render it correctly
  }
}
```

Or, you can also do it inside the `XUIReactBundle` config:

```ts
const kernel = new Kernel({
  bundles: [
    // ...
    new XUIReactBundle({
      components: {
        Loading: MyLoadingComponent,
      },
    }),
  ],
});
```

Creating new components is done in two steps, first we extend the interface, second we update the components as shown in the overriding phase:

```ts title="defs.ts"
import "@bluelibs/x-ui-react-bundle";

declare module "@bluelibs/x-ui-react-bundle" {
  export interface IComponents {
    MyCustomOne: React.ComponentType<OptionalPropsType>;
  }
}
```

### Table

The current default components created by this bundle:

| Syntax        | Props                          | Description                                                        |
| ------------- | ------------------------------ | ------------------------------------------------------------------ |
| Loading       | -                              | Used as a generic Loading component                                |
| Error         | error as `string` or `Error`   | A common way to display errors                                     |
| ErrorBoundary | -                              | The generic error boundary and how to handle components that throw |
| NotAuthorized | roles: "anonymous" or string[] | When there isn't a permission match                                |
| NotFound      | -                              | When the page is not found                                         |

## Wrappers

Wrappers are used to programatically wrap your application in different layers, for example, if you are creating a new `bundle` in which you do need a parent provider for your components, you can use this:

```ts
const kernel = new Kernel({
  bundles: [
    new XUIReactBundle({
      wrappers: [
        {
          component: MyProvider,
          props: {},
          order: 10, // Order of the wrapper as they are put in ascending order (<1><2></2></1>)
        },
      ],
    }),
  ],
});
```

Or via bundles:

```ts
class UIAppBundle extends Bundle {
  async prepare() {
    const xuiReactBundle = this.container.get(XUIReactBundle);

    // or addWrappers if you want an array
    xuiReactBundle.addWrapper({
      component: MyProvider,
      props: {},
      order: 10, // Order of the wrapper as they are put in ascending order (<1><2></2></1>)
    });
  }
}
```

We use this strategy for example when we integrate `Apollo` as a separate bundle, it automatically extends the wrappers giving us the ability to work with it without hassles.

## Smart

[Smart](/docs/package-smart) is a very small library which allows you to merge logic and state together in a separated class, integrated with the `container`.

```ts
import { EventManager } from "@bluelibs/core";
import { Smart, useSmart, newSmart } from "@bluelibs/x-ui-react-bundle";

class MySmart extends Smart<any, any> {
  @Inject()
  eventManager: EventManager;
}

function Component() {
  const [mySmart, Provider] = newSmart(MySmart);

  // mySmart has been instantiated by the container, seemlessly
}
```

## Events

You can use the good ol' reliable `EventManager` to emit events, but if you want to have a component listen to events during its lifespan (until it gets unmounted), you can use the hook: `useListener`.

Let's emit dem' vents:

```tsx
import { useListener, listen, useEventManager } from "@bluelibs/x-ui";
import { Event } from "@bluelibs/core";

class SomethingInTheWorldJustHappenedEvent extends Event<{
  what: string;
}> {}

function SomeComponent() {
  const eventManager = useEventManager();

  const onButtonClick = () => {
    eventManager.emit(
      new SomethingInTheWorldJustHappenedEvent({
        what: "Time has passed.",
      })
    );
  };
}

function OtherComponent() {
  // Use memo to avoid duplication of functions, or use an outside function
  const handler = useMemo(() => {
    return (e: SomethingInTheWorldJustHappenedEvent) => {
      // handle the event, change the state, or whatever

      // flashbacks:
      alert(e.data.what);
    };
  });

  // The built-in hook lets you listen to events while the component is mounted
  useListener(MyEvent, handler);
  // alias function that does the same thing:
  listen(MyEvent, handler);
}
```
