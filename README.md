# BlueLibs Repository

To find more about ourselves, our mission please go to [BlueLibs Official Website](https://www.bluelibs.com/) and [BlueLibs Official Documentation](https://www.bluelibs.com/docs/).

## Introduction

This monorepo is split like this:

- ./docs a microservice which represents our main website
- ./templates/\* things that are re-usable, like a new package template and others
- ./scripts/\* things we use for internal development
- ./packages/\* where all packages lie
- ./assets/\* things needed for GitHub README page

We use lerna so when you are in development phase you could use `lerna link`, and for example if your package depends on another package, for example, `logger-bundle` depends on `core`, you go to `logger-bundle` you run `lerna link`, then go to `core` and run `npm run watch`, now logger-bundle will use the updated variant of `core`.

If you want to try your new changes to an external application (outside this monorepo), the solution is to use `bluelibs-package-replace` binary:

```bash
# From Monorepo Root
chmod 755 /usr/local/bin/bluelibs-package-replace
sudo ln -s /usr/local/bin/bluelibs-package-replace `pwd`/scripts/bluelibs-package-replace
```

Now go to your `microservice` and simply run `bluelibs-package-replace x-ui`. This will properly update your package version to the one you have in the monorepo. Make sure you're also watching changes in `x-ui` package via `npm run watch`.

## Testing

Each package uses jest and ts-jest for development testing:

```bash
npm run test:dev
```

To run tests in C.I, we have the command `npm run test` which compiles the code and runs the final tests.

## Documentation

The documentation of each package is typically stored inside the package `DOCUMENTATION.md`. We decided for a separation between `README.md` and these files to keep README's a bit cleaner.

We store the docs in `./docs`, to compile all the documentation from all packages:

```bash
npm run docs:generate
```

The structure of the documentation can be found in: `docs/scripts/docs-structure.ts` based on it we craft the sections of the sidebar.
