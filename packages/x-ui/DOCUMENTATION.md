## Purpose

This is an umbrella package designed for web applications composed of the following packages:

- React
- React Router
- Session
- I18N
- Collections
- Guardian
- Apollo

This package re-exports everything from those packages, meaning you can use it as a one-place for all.

## Install

```bash
npm i -S @bluelibs/core @bluelibs/x-ui
```

This bundle automatically injects the other bundles into your dependency tree in the Kernel.

```ts
const kernel = new Kernel({
  bundles: [
    new XUIBundle({
      apollo: IUIApolloBundleConfig,
      guardian: IXUIGuardianBundleConfigType,
      sessions: IXUISessionBundleConfigType,
      react: IXUIReactBundleConfigType,
      i18n: IUII18NBundleConfig,
    }),
  ],
});
```
