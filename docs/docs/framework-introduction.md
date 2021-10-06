---
id: framework-introduction
title: Introduction
slug: /
---

BlueLibs is a TypeScript-based framework which aims at helping developers reach JS apps faster into production.

We are [Cult of Coders](https://www.cultofcoders.com/), a software development company which wanted to develop products faster for our clients. This is how BlueLibs was born.

Since our roots lie in custom development for our clients, our goal was to be able to generate apps really fast, but at the same, avoid sacrificing code quality and scalability for speed. Having experience in the Open-Source ecosystem, we immediately started working on these open-source components which took shape under the BlueLibs umbrella.

## The 3 Layers

BlueLibs is composed of 3 important layers built one one top of each other:

- **Foundation**
  - This is the "base", with independent or base-dependent modules (we call them bundles).
  - Contains core logic for handling bundles (initialisation, testing, shutting down, parameterisation, async event handling)
  - Serialization, Logger, Validation, Emailing (React-based), CLI Runners
  - Modules which integrate with: Express, Apollo, GraphQL
  - Database Integrations: MongoDB, PostgreSQL, MySQL
  - Abstract Security Layer (incl. Advanced Permissioning Systems)
  - Integrated with 500+ Authentication Strategies
- **X-Framework**
  - A fullstack framework leveraging Apollo GraphQL MongoDB on the backend and React for frontend.
  - The backend part works with any frontend (Vue, Svelte, iOS, Android)
  - Code Generator from Terminal (We call it: x)
  - Cronjobs Support
  - Uploads integrated with S3 (incl. Image Manipulation & Thumbnail Generation)
  - React UI Tooling (Live Data, Administration Interfaces)
  - Easy free deployment with Heroku and MongoDB Atlas
- **Blueprint**
  - We write code to generate X-Framework compatible code
  - Generates backend with collections, graphql entities, queries, mutations, inputs, services, cruds.
  - Generates ui admin with menu items for all exposed collections and their CRUDs
  - Fully featured:
    - Relations
    - Filterable Paginated Lists
    - Generates Create/Edit Forms
    - Auto-mocked Data Fixtures
    - Everything customisable

## Applicability

The sea of applicability is large, here's some examples:

- CMS for your websites
- Web Applications (Shops, Presentation, Custom)
- Backend Development
- Microservice-based web applications

At [Cult of Coders](https://www.cultofcoders.com), we are using BlueLibs to reach production faster for our clients by enabling rapid generation through `Blueprint` and ability to modify and scale the code how we see fit.

## Get Started

Installation prerequisities:

- [Node 14+ Installation](https://nodejs.org/en/download/)
- [MongoDB](https://docs.mongodb.com/v4.4/administration/install-community/)

Let's install the terminal tool for scaffolding and blueprint generation:

```bash
npm install -g @bluelibs/x
```

Now run it, press `x` and ENTER. And write "project", enter on it and follow the instructions, they should be very intuitive.

## Learning Curve

Before diving in each section, ensure you have your knowledge dependency graph, to accelerate your learning process. Whatever you want to start with, start with the core. It is essential to your understanding.

### Foundation

Foundation is composed of modules that are used by `X-Framework` such as `MongoBundle`, `ApolloBundle`, etc.

- [JavaScript Basics](https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/JavaScript_basics)
- [TypeScript Basics](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html)
- [TypeScript Clean Code Principles](https://github.com/labs42io/clean-code-typescript)
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

- Apollo GraphQL (autocompletion for your graphql servers on frontend)
- Git Lens (seeing history)
- GraphQL (syntax highlighting)
- Prettier (with auto-formatting)

## Conclusion

We hope that you will enjoy our work and join us in our goal to `Enhance Humanity through Software`!
