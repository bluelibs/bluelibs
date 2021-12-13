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

## Usage

You can generate a NextJS app using `x`:

```bash
npm i -S @bluelibs/x

x:microservice - frontend:next
```
