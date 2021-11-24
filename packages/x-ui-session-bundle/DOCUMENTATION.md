Session is a way to store data that is re-used across your components. Its design is fully isomorphic making it work for Server (for server-side rendering), Client (react), or React Native.

## Install

```bash
npm i -S @bluelibs/x-ui-session-bundle
```

```ts
import { Kernel } from "@bluelibs/core";
import { XUII18NBundle } from "@bluelibs/x-ui-i18n-bundle";
import { XUIReactBundle } from "@bluelibs/x-ui-react-bundle";

const kernel = new Kernel({
  bundles: [
    new XUIReactBundle(),
    new XUISessionBundle({
      defaults: {},
    }),
  ],
});
```

## Usage

We often need to store values somewhere that we later use it in our application, sometimes those values we want to be persisted in `localStorage` or somewhere so after refresh they can still be accessed.

`useUISession()` is a hook that allows for handling sessions easily. You can and add custom handlers on field change and persist the data to local storage.

In order to modify the interface and benefit of autocompletion, you have to extend it:

```ts title="defs.ts";
import "@bluelibs/x-ui-session-bundle";

declare module "@bluelibs/x-ui-session-bundle" {
  export interface IXUISessionStore {
    csrfToken: string;
  }
}
```

The hook provides the following methods:

```tsx
import {
  useUISession,
  UISessionStateChangeEvent,
} from "@bluelibs/x-ui-session-bundle";

function Component() {
  const session = useUISession();

  /* returns the value of a field. */
  const csrfToken = session.get("csrfToken");

  const onButtonClick = async () => {
    // To illustrate asynchronicity
    await session.set(fieldName, value, {
      // If you want this to be persisted to localStorage (on refresh) use perrsist: true
      persist: true,
    });
  };
}
```

## Events

```tsx
import {
  useUISession,
  useGuardian,
  UISessionEventChangeHandler,
} from "@bluelibs/x-ui-session-bundle";

// We define the handler: what to do when a field changes?
const authenticationDateHandler: UISessionEventChangeHandler = (event) => {
  const {
    data: { value, previousValue },
  } = event;

  console.log("Values have changed: ", { value, previousValue });
};

function Component() {
  const session = useUISession();

  // The get() is reactive, whenever sent.
  const lastAuthenticationDate = session.get("lastAuthenticationDate");

  useEffect(() => {
    session.onSet("lastAuthenticationDate", authenticationDateHandler);

    return () => {
      // just ensure the function is the same reference as the onSet one.
      session.onSetRemove("lastAuthenticationDate", authenticationDateHandler);
    };
  }, []);

  return (
    <div>
      {/* ...login form */}
      Last authentication: {lastAuthenticationDate?.toDateString()}
    </div>
  );
}
```

If you want to load the defaults of a session from somewhere (for example, in React Native you would need to hook-up an event on: `UISesssionInitialisingEvent` and `UISessionEventChangeHandler` to communicate with AsyncStorage):

```ts
class UIAppBundle extends Bundle {
  async prepare() {
    this.eventManager.addListener(UISesssionInitialisingEvent, async (e) => {
      Object.assign(e.data.defaults, {
        // Fetch some default data, if you're on the server for example from cookies, or
        // if you are on React Native from AsyncStorage
      });
    });

    this.eventManager.addListener(UISessionEventChangeHandler, async (e) => {
      if (e.data.options?.persist) {
        // Also store it inside async storage
      }
    });
  }
}
```
