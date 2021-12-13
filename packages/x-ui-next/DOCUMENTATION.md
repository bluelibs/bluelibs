## Purpose

This is the [X-UI](https://www.bluelibs.com/docs/package-x-ui/) package with support for NextJS.

## Install

```bash
npm i -S @bluelibs/x-ui-next
```

## Router

This package comes with its own router, in order to provide compatibility with [X-UI-Router](https://www.bluelibs.com/docs/package-x-ui-router-bundle), but also keep the functionalities from NextJS's router.

```js
import { useRouter } from "@bluelibs/x-ui-next";
```

The properties from `X-UI-Router` are accessible directly on the router, e.g.:

```js
import * as Routes from "./routes";

const Login = () => {
    const router = useRouter();

    const goToRegister = () => router.go(Routes.REGISTER);

    ...
}
```

If you want to access the properties of Next's router:

```js
const LanguageSwitcher = () => {
    const router = useRouter()

    const { push, pathname, asPath, query, locale } = router.next

    ...
}
```

## App Component

The default export from `/pages/_app.tsx`, which is the App component, is replaced by `createApp()`:

```ts
import { createApp } from "@bluelibs/x-ui-next";
import { kernel } from "../startup/kernel";

export default createApp({
  kernel,
  // optionally, you can pass "loadingComponent" for <XUIProvider>
});
```

## Usage

You can generate a NextJS app using `x`:

```bash
npm i -S @bluelibs/x

x:microservice - frontend:next
```
