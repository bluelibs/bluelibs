---
id: x-framework-introduction
title: Introduction
---

## Purpose

X-Framework is using the `Foundation` giving it an edge when using a fixed stack. We had to choose a specific stack (database, api layer) because we wanted to move really fast, so we focus on innovating tools that make Developer Experience better, instead of creating adaptors and focus on different API layers.

Our choise is using MongoDB together with [MongoBundle](package-mongo-bundle) with the powers of [Apollo](package-apollo-bundle) and [GraphQL](package-graphql-bundle).

We have also
ministration`layer which uses`Ant Design` and has great tooling for creating beautiful admin interfaces.

The biggest pain-point and deal-breaker for new adopters is the relational part. It's non-existent basically. Yes, they do offer a `$lookup` aggregator function, but it's extremely slow. We have created [Nova](package-nova) and we have made if faster than SQL in various scenarios and over 4x faster than `mongoose`. Not only is faster and more feature-rich than any other fetching layer, it is also complementing GraphQL enabling the ability to transform a
If you want to manually install it for a project:
GraphQL query into a Nova query in a snap and very securely.

### GraphQL

Oh boy, where can we begin praising this beautiful concept called GraphQL? Simply put it's an elegant language that can be used to interogate the server to get data in a well-documented and type-safe fashion.

Apollo is the lead implementation for Apollo on Node for the Server, and has great integration with `react`.

We have created lots of server tooling to aid us in working with the database.

### Conclusion

Blending MongoDB and GraphQL inside the ultra-scalable `Foundation` system brings developers extreme joy and speed in developing features for your inter-galactic app.

:::note
Even if we use [ApolloBundle](package-apollo-bundle) which is an express-based GraphQL solution, we support serverless because all the GraphQL logic is abstracted inside the [GraphQLBundle](package-graphql-bundle) and you can interchange it with your own API layer in the future. Bottom line, your code will not be very dependent on Apollo.
:::

## Applicability

While the applicability is quite large, we believe this framework is very well suited for:

- CRM Generation (relations, uploads)
- Mobile App Backends
- Business Process Automation Applications
- Enterprise Software Applications
- Microservices
- Serverless Applications

Because X-Framework contains both backend and frontend, we want to clarify that you are free to use any frontend you desire (Svelte, Vue, iOS).

## Learning Curve

We're sorry about this, but before you dive into X-Framework, it is important to understand the basics of:

- [Core](package-core)
- [Security](package-security-bundle)
- [Validation](package-validator-bundle)
- [GraphQL](graphql-bundle) & [Apollo](apollo-bundle)
- [Nova](package-nova)
- [MongoBundle](package-mongo-bundle)

Without having these principles set in place, X-Framework might look uncomprehensible, this is why we strongly encourage you to follow the documentation pages presented above to ensure smooth sailing, captain.

## Get Started

Ensure you have [Node](https://nodejs.org/en/download/) and [MongoDB](https://docs.mongodb.com/v4.4/installation) installed.

```bash
npm install -g @bluelibs/x
x
```

Type "project" and select "x:project", enter the required info.

:::note
[Blueprint](package-blueprint) is our flagship product which aims at helping you generate applications extremely fast, code which is `X-Framework` compatible.
:::

If you want to manually install it for a project:

```bash
npm install
npm run blueprint:generate
```

After that you follow the instructions to start your server and you just have a fully-featured API backend with GraphQL and an `UI` ready to handle your administration tasks including a very secure `User Password` system capable of being extended in any way you can imagine.

## Packages

In the next step we're going to describe the exact npm packages we are going to use and what their purpose is:

| Package                     | Context   | Description                                                                                       |
| --------------------------- | --------- | ------------------------------------------------------------------------------------------------- |
| @bluelibs/x                 | Server    | Contains the cli-generator and blueprint generation code                                          |
| @bluelibs/x-bundle          | Server    | Gives you common to use tooling for server-side X                                                 |
| @bluelibs/x-s3-bundle       | Server    | Uploads files and supports thumbnail generation + customizations                                  |
| @bluelibs/x-cron-bundle     | Server    | Run cronjobs at the intervals you pick                                                            |
| @bluelibs/x-password-bundle | Server    | GraphQL endpoints and emails for a fully-featured Password System                                 |
| @bluelibs/x-ui              | Web React | Works with `XBundle` on the server, type-safe routes, live data, authentication and so much more. |

We recommend sticking
when you want to have them reusable in other projects or contexts, otherwise focus on having separation of concerns done via folder structure inside `AppBundle`.

```yaml

If you want to manually install it for a project:
- package.json
- src
  - startup
    - kernel.ts
    - index.ts
    - bundles
      - app.ts
  - bundles
    - AppBundle
      - AppBundle.ts # Here is the main bundle class
      - __tests__
        - {name}.service.test.ts
      - services # Here we store our service layer, all logic should reside here
        - inputs
          - {Name}.input.ts # The GraphQL equivalent for this is inside {bundle}/grapqhl/inputs
        - {Name}.service.ts
      - listeners
        - {name}.listener.ts # A listener listens to events and delegates to services
      - events
        - {name}.event.ts
      - collections
        - index.ts # Re-exports everything from collections
        - {CollectionName}
          - {CollectionName}.collection.ts # Here we define our MongoDB collection
          - {CollectionName}.links.ts # Here we store the links
          - {CollectionName}.reducers.ts # Here we store the Nova reducers
          - {EntityName}.model.ts # Here we store the model and validation for it
          - index.ts # Exports collection name, model and enums
          - enums
            - {EntityName}{EnumType}.enum.ts # For example: PostStatus  with values PENDING, APPROVED, DISAPPROVED
      - graphql
        - entities
          - {EntityName}
            - {EntityName}.graphql.ts
            - {EntityName}.resolvers.ts
        - queries
          - {name} # here the name represents the actual naming of the query (eg: findUsers())
            - {name}.graphql.ts
            - {name}.resolvers.ts
        - mutations
          - {name}
            - {name}.graphql.ts
            - {name}.resolvers.ts
        - inputs # The class equivalent of this is stored under services/inputs
          - {Name}Input.graphql.ts
        - modules # Inside here we typically store CRUDs
          - {CollectionName}
            - {CollectionName}.graphql.ts
            - {CollectionName}.resolvers.ts
      - fixtures
        - index.ts # Loads fixtures (dummy data) to kickstart your app

```

### Client (React)

```yaml
- package.json
- src
  - startup
    - kernel.ts
    - index.ts
    - styles.scss # Main entry point for styles imports ui frameworks and bundle's styles
  - bundles
    - UIAppBundle
      - routes.tsx # Imports all routes
      - UIAppBundle.tsx
      - collections # These collections interact with the CRUD modules from Server
        - index.ts # Re-exports everything from here
        - {CollectionName}
          - {CollectionName}.collection.ts
          - index.ts
      - components
        - index.ts # Exports all components
        - styles.scss
        - {ComponentName}
          - {ComponentName}.tsx
      - overrides # These are the overrides for components we do when overriding other bundles
        - {ComponentName}.tsx
      - pages
        - routes.tsx # Here all routes are exported from the underlying pages
        - styles.scss # Imports all styles from pages
        - {PageName} # Here PageName can also represent a group of pages, we believe you should decide how to separate concerns at this level
          - routes.tsx
          - {PageName}.scss # Or styles.scss, how you prefer
          - {PageName}.tsx
          - components # We don't polute the top-level components folder when we have components specifically used for these pages
            - {PageSpecificComponent}.tsx
      - services
        - {Name}.service.ts
      - styles
        - style.scss # The main entry point of styles for this bundle
```

## FAQ

#### Can I use it without React?

Yes. You are not bound to use any framework on the frontend, you can definitely use `Vue`, `Angular` and others, the reason we chose `React` was for its large ecosystem and we added extra features such as `Dependency Injection`, `Live Data`, `Database on client` concepts and so much more.

#### Can I still have REST routes in X-Framework?

Yes. Inside `ApolloBundle` you have access to the underlying express app, giving you the capability of adding any type of routes you want.
