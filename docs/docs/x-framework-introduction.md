---
id: x-framework-introduction
title: Introduction
---

The X-Framework is a set of tools built on top of the Foundation which work with MongoDB as database and Apollo & GraphQL as the API and React as our frontend templating engine. Because of that we have built a very handy cli-tool to aid you in your adventure:

```bash
npm i -g @bluelibs/x
x
```

Choose a new project, give it a name, and then you can either create additional (frontend or backend) microservices as you find them fit or you can use the Blueprint from the get-go:

```bash
npm install
npm run blueprint:generate
```

For more information on Blueprint, we recommend you go to the specific section which covers it.

Before you dive into X-Framework, it is important to understand the basics of Core, Validation, GraphQL and Nova and MongoDB. If you haven't already, please give them a read before diving deeper so the information can be properly assimilated.

The logic to achieve most of the functionality on the server is stored within `XBundle` from `@bluelibs/x-bundle` and for UI we store it inside `XUIBundle()` from `@bluelibs/x-ui`. All bundles designed to work with X-Framework start with `x`. UI bundles start with `x-ui` eg: `x-ui-admin`. We chose to avoid suffixing `-bundle` at UI level to have a shorter, more aesthetic name, anything that starts with `x-ui` is definitely a bundle, however, for server side we decided to keep the convention of `x-{name}-bundle` naming, eg: "x-uploads-bundle", etc.

## Folder Structure

We can understand this folder structure may not be as beginner friendly, but we believe that your app quickly reaches a phase where such separations are needed, when you go beyond a quick to-do list. Therefore we have decided to have an almost fixed folder structure, this would allow code-generators to properly read and understand your code base to give you meaningful autocompletions, and automatic exporting and injecting of functionality without you having to do anything extra.

### Server

```yaml
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

Everything starts by installing the command line generator:
