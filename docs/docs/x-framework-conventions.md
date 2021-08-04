---
id: x-framework-conventions
title: Conventions
---

In this chapter we're gonna talk about the conventions used in X-way.
They are enforced by the client generator, and if you want to get the full benefits and autocompletion,
you must respect them.

We strongly advise that you also follow [the conventions here](https://github.com/ryanmcdermott/clean-code-javascript), even if they are for JavaScript, you can easily adapt them for TypeScript. It will allow you to write better, more scalable code.

## Exports

When we're creating a module. We advise against using default exports: `export default XXX`. Rather use named exports: `export

```typescript
export const VALUE = "xxx";
```

The reasons for this are:

- Easy refactoring of your models (especially when using a smart IDE like VSCode)
- More accurate autocompletion and auto imports as you use them

## File naming

When naming files, always use capital case for classes, lower-case for sets. For example if a file exports a class make the file uppercase (`FileUtilitary.ts`), if it exports a set of functions you can have it lower-case (`utils.ts`)

If we have a special element such as Collection, Event, Exception, Listener, Service, etc, we also want to suffix the name with the file's speciality in the following pattern: `Post.service.ts`.

Another way would have been `PostService.ts` however we made the choice above for easier search reasons.

The exported value for special element should be suffixed by the name, for example `Post.service.ts` exports a constant: `PostService`.

Reasoning:

- Easy to find the files without looking at folders. You can just search for `Post.` and you may find collections, services, events and you can either put `.e` or `.s` for service and it takes you to the right file.
- You know the file's responsability not only based on the folder it is in.
- The cli generator can autocomplete those kind of files (For example when linking collections, it can easily find all collections from your microservice)

## Interfaces vs Types

Use types when you have no choice. That's the rule. Always prefix the interfaces with `I` for easier searchability and to avoid confusion with models.

Reasoning:

- Interfaces from other modules can be extended:

```ts title="defs.ts"
// Assuming `my-module` exports an interface called User
import "my-module";

declare module "my-module" {
  export interface IUser {
    newVariable: string;
  }
}
```

Now you can use everywhere in your bundle the interface from "my-module" and it will be extended as described.

## Folder Structure

This folder structure is thought through to support modern-web development with microservices in mind.

```yaml
- {projectRoot}
  - microservices
    - {microservice}
      - src
        - bundles
          - {YourBundle}
            - __tests__
            - collections
              - {collectionName}
                - {CollectionName}.links.ts
                - {CollectionName}.collection.ts
                - {CollectionEntity}.model.ts
            - events
            - exceptions
            - fixtures
            - graphql
              - entities
                - {Entity}
                  - {Entity}.graphql.ts
                  - {Entity}.resolvers.ts
              - inputs
                - {Input}.graphql.ts
              - mutations/queries
                - {mutationName}
                  - {mutationName}.graphql.ts
                  - {mutationName}.resolvers.ts
              - index.ts
                - Loads resolvers and .graphql.ts files automatically using @bluelibs/graphql-bundle
            - listeners
              - {Listener}.listener.ts
            - server-routes
              - {routeName}.route.ts
            - services
              - inputs
                - {Input}.input.ts
              - {Service}.service.ts
            - validators
              - {Validator}.validator.ts
            - constants.ts
            - defs.ts
            - {YourBundle}.ts
        - startup
          - index.ts
            - Initialises the kernel imported from `kernel.ts` after all bundles have been imported
          - env.ts
            - Reads environment variables and exports a js module
          - kernel.ts
            - Instantiates the kernel end exports it. Initialisation is done index.ts
            - You are also allowed to initialise the kernel with some default bundles here
          - bundles
            - index.ts
              - Imports all bundles in here
            - {bundleName}.ts
              - Adds the specified bundle to the kernel by importing the kernel and using kernel.addBundle()
      - package.json
      - README.md
  - package.json
  - README.md
```
