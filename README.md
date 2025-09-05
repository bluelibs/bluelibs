<p align="center">
  <a href="https://www.bluelibs.com" target="_blank"><img src="https://www.bluelibs.com/img/github/bluelibs-logo.svg" alt="BlueLibs Logo" width="60%"/></a>
</p>

<p align="center">
  <a href="https://circleci.com/gh/bluelibs/bluelibs/tree/main"><img src="https://circleci.com/gh/bluelibs/bluelibs/tree/main.svg?style=svg" alt="coverage" /></a>
  <a href="https://github.com/bluelibs/bluelibs/blob/main/LICENSE.md"><img alt="GitHub license" src="https://img.shields.io/github/license/bluelibs/bluelibs"></a>
  <a href="https://github.com/bluelibs/bluelibs/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/bluelibs/bluelibs?label=stars"></a>
  <a href="https://discord.com/invite/GmNeRDqxvp" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
</p>

## Quick Note

If you want to keep track of our progress, or just show a little bit of support, click the `Watch` 👁‍🗨 button or give us a `Star` ⭐️. Thank you!

## About BlueLibs

BlueLibs is a collection of open-source products which help you quickly prototype web applications and scale your app while respecting [SOLID](https://en.wikipedia.org/wiki/SOLID) principles. This is [our official website](https://www.bluelibs.com), this is [our documentation page](https://www.bluelibs.com/docs/).

Features:

- 👉 [Dependency Injection & Module Management](https://www.bluelibs.com/docs/package-core)
- 👉 Database-agnostic and fully featured [Security System](https://www.bluelibs.com/docs/package-security)
- 👉 Server-agnostic [GraphQL Integration](https://www.bluelibs.com/docs/package-graphql) with [Apollo](https://www.bluelibs.com/docs/package-apollo)
- 👉 [MongoDB](https://www.bluelibs.com/docs/package-mongo) & [PostgreSQL](https://www.bluelibs.com/docs/package-sql) Integrations
- 👉 Rapid Prototyping via [Blueprint](https://www.bluelibs.com/products/blueprint/) and [X-Framework](https://www.bluelibs.com/products/x-framework/)
- 👉 [Code Generation Tooling](https://www.bluelibs.com/docs/package-x-cli)
- 👉 [GraphQL Live Data for Single Documents & Queries](https://www.bluelibs.com/docs/package-x-bundle#live-data) via X-Framework

## Get Started

Our rapid prototyping solution (Blueprint for X-Framework) is tightly coupled to GraphQL and MongoDB. BlueLibs as a whole isn't. and supports [SQL](https://www.bluelibs.com/docs/package-sql).

```bash
# Install MongoDB & Node 14+
npm i -g @bluelibs/x
x # pick project and complete it there
cd project
npm run blueprint:generate
npm run start:api
npm run start:admin # Start after API has started
```

## Learning BlueLibs

We have designed a custom [documentation](https://www.bluelibs.com/docs) experience with custom code snippets and challenges.

## Security Vulnerabilities

If you discover a security vulnerability within BlueLibs packages, please send an e-mail to Theodor Diaconu via [theodor@bluelibs.com](mailto:theodor@bluelibs.com). All security vulnerabilities will be promptly addressed.

## License

The BlueLibs ecosystem is open-sourced software licensed under the MIT License.

## Repository Structure

This monorepo is split like this:

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

Each package uses jest and ts-jest for development testing:

```bash
npm run test:dev
```

To run tests in C.I, we have the command `npm run test` which compiles the code and runs the final tests.

## Branching & Commits

**Names**

- feature/{package}/{issueNumber}-short-summary (feature/mongo-bundle/143-solve-the-bug-with-blablbla)
- fix/{package}/{issueNumber}-short-summary
- fix/{package1}-{package2}/{issueNumber}-short-summary

**Commits**

- fix({package}): {message} (#143)
- Example: fix(mongo-bundle): Solved the issue with async (#143))
- feat({package}): {message} (#143)
- deps({package}): {version}
- docs({package}): {message}

- fix({package1}, {package2}): {message}

**PRs**

- Checkout from `main`
- `git checkout -b feature/{package}/{issueNumber}-short-summary`
- an initial empty commit: git commit -m "fix({ package }): do that (#143)" --allow-empty
- Create the PR prefixed with `[WIP] Title of the branch`
- Ensure that inside the branch there's a link to the issue
- Create for yourself a list of tasks for the issue (Implementation, Testing, Documentation) using GitHub Task's markdown
- Once the task is ready prefix it with `[R]`.
