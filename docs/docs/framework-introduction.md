---
id: framework-introduction
title: Introduction
slug: /
---

** INSERT IMAGE HERE **

BlueLibs is a TypeScript-based framework which aims at helping developers reach JS apps faster into production.

We are Cult of Coders, a software development company which wanted to develop products faster for our clients. This is how BlueLibs was born.

Since our roots lie in custom development for our clients, our goal was to be able to generate apps really fast, but at the same, avoid sacrificing code quality and scalability. Having experience in the Open-Source ecosystem, we immediately started working on these open-source components which took shape under the BlueLibs name.

Carl Sagain said: "If you want to make an applie pie from scratch, you must first create the universe", the same reasoning is applied here,
we had to create a universe of modules that can interoperate, nothing in "the wild" satisfied our needs, we had to take action and in Jan 2020 we started.

## The 3 Layers

BlueLibs is composed of 3 important layers built one one top of each other:

- **Foundation**
  - This is the "base", with independent or base-dependent modules (we call them bundles).
  - Contains core logic for handling bundles (initialisation, testing, shutting down, parameterisation, async event handling)
  - Serialization, Logger, Validation, Email, CLI Runners
  - Modules which integrate with: Express, Apollo, GraphQL
  - Database Integrations: MongoDB, PostgreSQL, MySQL
  - Abstract Security Layer (incl. Advanced Permissioning Systems)
  - Integrated with 500+ Authentication Strategies
- **X-Framework**
  - A fullstack framework leveraging Apollo GraphQL MongoDB on the backend and React for frontend.
  - Code Generator from Terminal (We call it: x)
  - Cronjobs Support
  - Uploads integrated with S3 (incl. Image Manipulation & Thumbnail Generation)
  - React UI Tooling (Live Data, Administration Interfaces)
- **Blueprint**
  - We write code to generate X-Framework compatible code
  - Generates backend with collections, graphql entities, queries, mutations, inputs, services, cruds.
  - Generates ui admin with menu items for all exposed collections and their CRUDs

## Applicability

The sea of applicability for BlueLibs is quite large, we're going to list few of the most common scenarios:

- CMS for your websites
- Admin Interfaces for your database
- Custom Web Applications
- Easy Backend for Mobile/Frontend Developers
- Highly focused microservices

At Cult of Coders, we are using BlueLibs to reach production faster for our clients by enabling rapid generation through `Blueprint` and ability to modify and scale the code how we see fit.

## Get Started

Installation prerequisities:

- [Node 14+ Installation](https://nodejs.org/en/download/)
- [MongoDB](https://docs.mongodb.com/v4.4/administration/install-community/)

Let's CLI tool for scaffolding and blueprint generation:

```bash
npm install -g @bluelibs/x
```

Now run it, press `x` and ENTER. And write "project". Name your project and follow the instructions.

## Learning Curve

Before diving in each section, ensure you have your knowledge dependency graph, to accelerate your learning process:

### Foundation

Foundation is composed of modules that are used by `X-Framework` such as `MongoBundle`, `ApolloBundle`, etc. We categorise as a foundation bundle a bundle that is either independent, either depends on other modules from `Foundation`.

- [JavaScript Basics](https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/JavaScript_basics)
- [TypeScript Basics](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html)
- Knowledge: [Object Oriented Programming](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes), [Promises](https://www.freecodecamp.org/news/javascript-es6-promises-for-beginners-resolve-reject-and-chaining-explained/), [Dependency Injection](https://www.infoworld.com/article/2974298/exploring-the-dependency-injection-principle.html), [Observer Pattern](https://webdevstudios.com/2019/02/19/observable-pattern-in-javascript)
- [Prettier Code-Formatting Tool](https://prettier.io/)

### X-Framework

X-Framework is basically another bundle we call it `XBundle` for server, and `XUIBundle` for the ui. Our code is isomorphic in nature, giving us the ability to use same core concepts for React. This makes heavy use of the `MongoBundle` and `ApolloBundle` and dictates the stack.

- [Foundation](#foundation)
- Backend:
  - [MongoDB Basics](https://www.mongodb.com/basics)
  - [MongoDB Bundle Documentation](https://www.bluelibs.com/docs/package-mongo)
  - [GraphQL Basics](https://www.howtographql.com/basics/2-core-concepts/)
  - [GraphQL Bundle](https://www.bluelibs.com/docs/package-graphql), [Apollo Bundle](https://www.bluelibs.com/docs/package-apollo), [Apollo Security](https://www.bluelibs.com/docs/package-apollo-security) Documentation
  - [Testing with JEST](https://jestjs.io/docs/getting-started)
  - [Security](https://www.bluelibs.com/docs/package-security), [Security MongoDB Adaptor](https://www.bluelibs.com/docs/package-security-mongo), [Password Strategy](https://www.bluelibs.com/docs/package-password-bundle)
- React
  - [Basics](https://www.w3schools.com/REACT/default.asp)
  - [Apollo Client](https://www.apollographql.com/docs/react/get-started/)

### VSCode

We recommend you use VSCode with the following extensions:

- Apollo GraphQL
- Git Blame
- GraphQL
- Prettier

## Conclusion

We hope that you enjoyed our work and join us in our goal to `Enhance Humanity through Software`!

For contribution please go to our main GitHub repo: [https://github.com/bluelibs/bluelibs](https://github.com/bluelibs/bluelibs), star it, clone it and follow the instructions in the main `README`.
