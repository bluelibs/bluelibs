# BlueLibs Development Playground

To read the documentation visit [BlueLibs Official Documentation](https://www.bluelibs.com/docs/).

Hello there fellow developer! This GitHub package is mainly used to quickly bootstrap BlueLibs and start working on the core components or BlueLibs's official bundles.

It is also the place where all the stars need to be collected to show-case its popularity. So if you enjoy this work please show your support by starring this package. If not, let us know what can we do to deserve it, [our feedback form is here](https://forms.gle/DTMg5Urgqey9QqLFA)

## Setup

Pull all submodules locally:

```bash
git submodule update --init --recursive
```

Be up to speed with all submodules:

```bash
git submodule update --remote --rebase
```

Each submodule has its own documentation and instructions please follow their `README.md` for more information.

When developing packages, there are two essential commands you can use `npm run watch` to start watching changes to your typescript, and `npm run test:watch` to run tests to assert everything works.

Our packages work together as a team, this is why sometimes we have to develop them in such a way. We use lerna to allow us to link a `@bluelibs/**` package to our local ones, to activate it, you can go to the desired package and just do `lerna link`, please note that this will happen with all `@bluelibs/**` packages.
