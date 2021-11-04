## Install

```bash
npm install --save @bluelibs/mongo-bundle @bluelibs/nova
```

## Prepare

- [Install MongoDB](https://docs.mongodb.com/manual/administration/install-community/)
- [Official MongoDB Documentation](https://www.mongodb.com/basics)
- [Neat 10-min tutorial](https://medium.com/nerd-for-tech/all-basics-of-mongodb-in-10-minutes-baddaf6b6625)

## Purpose

At BlueLibs, we love MongoDB. So easy to develop on it, their query language makes a lot of sense, and it is close to us, JS developers, we can even write JS code that gets executed even at database-level. We like it for a lot of things, however, the database on itself doesn't have a reliable relationship fetching mechanism ([`$lookup`](https://docs.mongodb.com/manual/reference/operator/aggregation/lookup/) is very slow), forcing developers to denormalize data and putting them to face other issue with this.

The problem with relational data has been solved by [Nova](package-nova), and we have [achieved speeds faster than RAW SQL](https://docs.google.com/spreadsheets/d/1cA2c6e9YvE-fA8LEaDwukgrvYNOIo8RmNjy8cPWby1g/edit#gid=0), test [code can be found here](https://github.com/bluelibs/bluelibs/tree/main/packages/nova/benchmarks/sql).

`Nova` will not make everything perfect, but it makes fetching relational data a breeze. This bundle offers beautiful integration with Nova so we can use it in our collections.

## Basic Setup

```ts
import { MongoBundle } from "@bluelibs/mongo-bundle";

kernel.addBundle(
  new MongoBundle({
    uri: "mongodb://localhost:27017/test",

    // Optional if you have other options in mind
    // https://mongodb.github.io/node-mongodb-native/3.6/api/MongoClient.html#.connect
    options: MONGO_CONNECTION_OPTIONS,
  })
);
```

Get started with our [MongoBundle Essential Boilerplate](https://stackblitz.com/edit/node-ebpceh?file=src%2Fsimple-collection-setup%2Findex.ts);

## Collections

A collection is in fact a service. Thus making it accessible via the `container`. We define our collections as extensions of `Collection` in which we can customise things such as: `collectionName`, `indexes`, `model`.

```typescript
import { Collection } from "@bluelibs/mongo-bundle";

// We can optionally create a type and have full typesafety
type User = {
  firstName: string;
  lastName: string;
};

class UsersCollection extends Collection<User> {
  static collectionName = "users";

  static indexes = [
    {
      key: { firstName: 1 },
      // Other options can be found here in IndexSignature:
      // https://github.com/DefinitelyTyped/DefinitelyTyped/blob/0543eca60008efb636775a21aec7b7f5e798682a/types/mongodb/index.d.ts#L3408
    },
  ];
}
```

:::note
We've opted for `static` definition instead of the `abstract` approach of methods (`getCollectionName()`) because static variables can be manipulated with ease, so for example if you have a collection from a bundle, and you would simply want to rename the collection name, or add another index, relation, or behavior, doing this is trivial. We understand that the abstract methods can hold certain advantages however because of the freedom these static variables offer, we stuck to it.
:::

As with everything in BlueLibs's world, you get the instance via the container, for that you'd have to work within your application bundle.

```typescript
const usersCollection = container.get(UsersCollection);

// You have access to the classic MongoDB Node Collection
usersCollection.collection;
```

You have access to directly perform the more popular mutation operations:

- insertOne
- insertMany
- updateOne
- updateMany
- deleteOne
- deleteMany
- count
- aggregate
- find
- findOne
- findOneAndUpdate
- findOneAndDelete

## Events

Our `Collection` services have a neat integration with the `EventManager`. We dispatch events before and after important things happen: "insert", "update", "remove". These events can be imported from this package:

### Types

```ts
- BeforeInsertEvent
  - document
  - context
- AfterInsertEvent
  - document
  - _id
- BeforeUpdateEvent
  - filter (filters for update)
  - update (the modifier)
  - fields (the fields affected by the update)
  - isMany
- AfterUpdateEvent
  - filter (filters for update)
  - update (the modifier)
  - fields (the fields affected by the update)
  - isMany
  - result: UpdateWriteOpResult | FindAndModifyWriteOpResultObject
- BeforeDeleteEvent
  - filter (what gets deleted)
  - isMany (if it is a removeMany());
- AfterDeleteEvent
  - filter
  - isMany
  - result: DeleteWriteOpResultObject | FindAndModifyWriteOpResultObject<any>;
```

Events accepts an optional generic representing the document, example: `AfterUpdateEvent<User>` so you can get better autocompletion when performing the changes.

:::note
If you want to bypass all events, the current solution is to use the native MongoDB Node collection, accessible via: `postsCollection.collection`, where `postsCollection` is retrieved from the container.
:::

### Listening

Inside every collection there is a `localEventManager` which is an instance of `EventManager` completely separated. When we emit events we emit them both to `localEventManager` and the global one. The reasoning for this is to have collection-specific events without having to be filtered:

```ts
postsCollection.on(BeforeInsertEvent, (event: BeforeInsertEvent<Post>) => {
  // Handle it.
});
```

And if you like to use the global EventManager:

```ts
eventManager.addListener(BeforeInsertEvent, (e) => {
  // Using collection hook events, avoid polusion of listeners of global event manager
  // But the events are still dispatched and recognizable.
  if (e.collection instanceof PostsCollection) {
    // ok, do your thang
  }
});
```

If you want to perform certain actions for elements once they have been updated or removed (events: `AfterUpdateEvent` and `AfterDeleteEvent`) the solution is to get the filter and extract the `_id` from there.

If you want to use the [Listener](package-core/#listeners) pattern it will look something like:

```ts
import { PostsCollection, Post } from "./posts.collection";
import { Listener, On } from "@bluelibs/core":
import { BeforeInsertEvent } from "@bluelibs/mongo-bundle";

@Service()
class DatabaseListener extends Listener {
  @On(BeforeInsertEvent, {
    filter: e => e.data.collection instanceof PostsCollection
  })
  onPostInserted(e: BeforeInsertEvent<Post>) {
    // Do your thing, you can use property inject to get other services
  }
}

// And ofcourse don't forget to `warmup()` the listeners.
```

### Context

Events also receive a `context` variable this is `IExecutionContext` and can be extended via:

```ts title="declarations.ts"
import "@bluelibs/mongo-bundle";

declare module "@bluelibs/mongo-bundle" {
  export interface IExecutionContext {
    // Now the context can receive an optional `companyId`
    companyId?: ObjectId;
  }
}
```

Each `CollectionEvent` has the `context` inside its dataset (`event.data.context`). Which gives you power to act accordingly. For example, inside the `Blameable` behavior, we pass `userId`.

```ts
// Doing this, the `context
postsCollection.insertOne(document, {
  context: {
    companyId,
  },
});
// This is the `options` argument available for all mutations.
```

## Nova Integration

We need a way to link collections and fetch data with blazing fast speeds. For this purpose, [Nova](package-nova) comes to the rescue and we strongly recommend you read through it first to get all the concepts clarified.

Nova is extremely fast and gives us the freedom to think relational in NoSQL, enhancing our developer experience.

We also offer type-safety when making queries which enables us to work in a very scalable fashion.

### Basics

```typescript
// Fetch it from the container
const usersCollection = container.get(UsersCollection);

usersCollection.query({
  $: {
    filters: {
      // mongo filters
      _id: someUserId
    }
    options: {
      // limit, skip, sort
    }
  }
  // Specify the fields you need, autocompleted if the Collection has as model passed as Generic.
  firstName: 1,
  lastName: 1,
});

// use .queryOne() if you are expecting a single result based on filters and/or options
```

The way we define links for `Nova` is through the static variables: `links`, `reducers`, `expanders`:

```typescript
class UsersCollection extends Collection {
  static collectionName = "users";
}

class Human {
  firstName: string;
  lastName: string;

  /**
   * We mark with @reducer the fields which are computed on demand.
   * @reducer
   */
  fullName: string;
}

class HumansCollection extends Collection<Human> {
  static collectionName = "posts";

  static links = {
    user: {
      collection: () => UsersCollection,
      // Or if you want to benefit of dynamic linking:
      // collection: (container) => container.get(USERS_COLLECTION_TOKEN);
      field: "userId",
    },
  };

  // Nova reducers are a sort of virtually computed variables.
  // Note: reducers include "container" in the context property of their params.
  static reducers = {
    fullName: {
      // Here you specify what you depend on from the `Human` model to be able to compute it
      // Being this specific,  inimises the amount of data fetched.
      dependency: {
        firstName: 1,
        lastName: 1,
      },
      // Reducers accept a context that is from the Query (more details in Nova documentation)
      reduce(user: User, { context }}) {
        // Get access to container if reducing this is to be delegated to a service
        const container = context.container;
      }
    }
  };

  // Nova expanders. Rarely to be used.
  static expanders = {};
}
```

Now you can query freely:

```typescript
const humansCollection = container.get(HumansCollection);

humansCollection.query({
  // You can query any field including reducers and expanders
  fullName: 1,
  user: {
    _id: 1,
  },
});
```

:::note
Keep in mind that links are attached on `.collection` (the raw MongoDB Node collection) under the `Collection` class from `@bluelibs/mongo-bundle`, so if you want to use the methods of `query()` or `lookup()` from Nova, ensure that you use the proper collection otherwise you will get errors.
:::

Using bare-bones `Nova`:

```ts
import { lookup, query } from "@bluelibs/nova";

const postsCollection = container.get(PostsCollection);
const results = query(
  // NOTE! The .collection is the raw one, where the links are actually attached.
  postsCollection.collection,
  {
    $: {
      pipeline: [
        lookup(postsCollection.collection, "user"),
        // Note that we use .collection, because that's where links are attached.
      ],
    },
  },
  // This is the context to pass to reducers.
  {
    // And if you have container aware reducers you have to pass the context here:
    container,
  }
);
```

If you want to benefit of JIT bson-decoding for your data you can add it through `jitSchema` static variable. This speeds up the data fetching speeds by ~50% (the more data you fetch, the faster it gets).

:::warning
Keep in mind that if you forget to update the `jitSchema` you won't be able to receive the data not defined in schema from MongoDB, making you wonder what is going on, we advise using this only when you actually need it. Prematurue optimisation is not healthy.
:::

Example for a collection that contains only `name: string`:

```ts
class PostsCollection extends Collection {
  // optional for absolute performance, import { t } from "@bluelibs/nova"
  // Documentation is here: https://deepkit.io/documentation/type
  // This only applies to Nova query-ing
  static jitSchema = t.schema({
    name: t.string,
  });
}
```

### GraphQL

[Nova Query](package-nova#graphql-integration) has an intuitive GraphQL transformation, which allows you to transform the `AbstractSourceTree`, which is the "query" transformed in a OOP-model, to a `Nova` query body so you can return only what is requested + collection-linked. This is the magical part.

:::note
This part is related to [GraphQL Bundle](package-graphql). Ensure that you are comfortable with it first.
:::

```ts
const resolvers = {
  Query: {
    posts(_, args, ctx, ast) {
      const postsCollection = ctx.container.get(PostsCollection);

      return postsCollection.queryGraphQL(ast, {
        // These are the AstToQueryOptions presented in the link above as: Nova Query
        filters: {
          isApproved: true,
        },
      });

      // for single element finds, use: postsCollection.queryOneGraphQL()
    },
  },
};
```

The query you can make from your client would be similar to a GraphQL Query:

```graphql
## This is how you would define it in GraphQL Server
type Query {
  posts: Post[]
}

type User {
  name: String!
}

type Post {
  title: String!
  user: User!
}

# Now the query from frontend would look like:
query {
  posts {
    title
    user {
      name
    }
  }
}
```

Behind the scenes, Nova will transform the request into its own "request-fetching language", and if you keep the same name in GraphQL API for the defined `links` in the `Collection` classes, then it will work as magic.

Ofcourse, you would need to secure this and restrict these behaviors, to do so take a look at `intersect` option inside [Nova's documentation for GraphQL](package-nova#graphql-integration).

## Behaviors

The nature of the behavior is simple, it is a `function` that receives the `collection` object when the collection initialises. And you can listen to events on the collection and [make it behave](https://www.youtube.com/watch?v=F1lJFlB-89Q).

Let's create a behavior that logs the insertions of a document:

```ts
function logInsertions(collection) {
  // You container access via collection.container if you need custom services, etc.
  collection.on(BeforeInsertEvent, (e: BeforeInsertEvent) => {
    // This listener is local only, it only applies to this collection
    const service = collection.container.get(DocumentLoggerService);
    service.log(e.data.document);
  });
}
```

```ts
class GovernmentFilesCollection extends Collection {
  static behaviors = [logInsertions];
}
```

If for example, your behavior can get configurable based on some options then the approach would be like this:

```ts
function logInsertions(options) {
  return (collection) => {
    // do your thing here based on options
    // options.name
  };
}
```

```ts
class GovernmentFilesCollection extends Collection {
  static behaviors = [
    logInsertions({
      name: "government",
    }),
  ];
}
```

So ultimately, the behavior array is an array of functions.

### Timestampable

This would enter `createdAt`, `updatedAt`. You can also customise how the fields are named.

```typescript
import { Behaviors, Collection } from "@bluelibs/nova";

class UsersCollection extends Collection {
  static behaviors = [
    Behaviors.Timestampable({
      // optional config
      fields: {
        // mention the actual field names to be saved
        createdAt: "createdAt",
        updatedAt: "updatedAt",
      },
    }),
  ];
}
```

:::note
When the document is created for the first time, we also store `updatedAt` to the exact date of `createdAt`.
:::

### Blameable

The blameable behavior stores who created or updated the document by reading `userId` from the context passed. `context` is a special option we allow in all mutations (insert/update/delete) that is designed to work well with behaviors or other event listeners.

```ts
class UsersCollection extends Collection {
  static behaviors = [
    Behaviors.Blameable({
      // optional config
      fields: {
        createdBy: "createdBy",
        updatedBy: "updatedBy",
      },
      // If this is true, you always have to provide a { userId } in the context, may it be null
      // userId is typically null when the system does the operation (like in a cronjob)
      throwErrorWhenMissing: true,
    }),
  ];
}
```

```ts
const usersCollection = container.get(UsersCollection);
await usersCollection.insertOne(
  {
    firstName: "John",
    lastName: "Smithsonian",
  },
  {
    context: {
      userId: "XXX", // or null, but not undefined.
    },
  }
);
```

:::note
When the document is created for the first time, we also store `updatedBy` to the same user as `createdBy`. Because in theory `creation` is also an `update`, we understand there can be mixed feelings about this. If you want to identify whether this document has had any changes, we recommend creating an `isTouched` boolean variable and update it after the `BeforeUpdateEvent` from `@bluelibs/mongo-bundle`. And inside the event you can do this for all collections or filter for the ones you need.
:::

### Validate

This behavior leverages the `ValidateBundle`. We use it when we want to ensure that what we insert is valid, so it performs validation against the model on insert, and upon update it does the following inside a transaction:

1. Applies the mutation
2. Gets the full document
3. Performs validation

In case of exception the transaction throws and is canceled. This might not be indicated to be applied on collections that get frequent updates, however this is a very secure way of ensuring data consistency because update operations might have unpredictable impact, for example, let's say we have a validation where a number must be under 100, but then we have an update modifier that does `{$inc: 1}`. We cannot know the impact this may have, hence this solution.

```ts
class UsersCollection extends Collection {
  static behaviors = [
    Behaviors.Validate({
      model: User, // This is the standard @Schema() described model
      // These are the options from ValidateBundle
      // options?: ValidateOptions;
      // cast?: boolean;
      // castOptions?: any;
    }),
  ];
}
```

### Softdeletable

This behavior is used when you want to delete documents, but still keep them in the database for future reference. So imagine the situation where you have a lot of tasks, and when you delete a user, instead of deleting it you flag it as `isDeleted`, so when other people view the task they might also see who the user was, but when you are searching for users, that user should no longer appear.

```ts
class UsersCollection extends Collection {
  static behaviors = [
    Behaviors.Softdeletable({
      fields: {
        isDeleted: "isDeleted",
        deletedAt: "deletedAt",
        deletedBy: "deletedBy", // if userId is passed in the context it will be stored
      },
    }),
  ];
}
```

```ts
const usersCollection = container.get(UsersCollection);

// You can use deleteOne() or deleteMany()
await usersCollection.deleteOne(
  { _id: userIdToDelete },
  {
    context: {
      userId: byUserId,
    },
  }
);

const user = await usersCollection.findOne({ _id: userId }); // null
const user = await usersCollection.find({ _id: userId }).toArray(); // []
// This is the same for query, queryOne, queryGraphQL, queryGraphQLOne

// Updating won't work still.
await usersCollection.updateOne(
  { _id: userId },
  {
    $set: {},
  }
);

// If you do want to find, update the user, specify inside the filters { isDeleted: true }
const user = await usersCollection.findOne({ _id: userId, isDeleted: true }); // will return the user object
```

We automatically apply an index on `isDeleted` so you do not have to worry about performance.

If you are using `Softdeletable` behavior, and you are also using `Nova` links, ensure to add the filters `{ isDeleted: { $ne: true } }` to the links pointing towards the soft deletable collection, otherwise, when fetching with `Nova` those will be returned. Sometimes you do want them to be returned because of consistency, it very much depends on your usecase:

```ts
class UsersCollection extends Collection {
  static links = {
    comments: {
      collection: () => CommentsCollection,
      filters: {
        isDeleted: { $ne: true },
      },
    },
  };
}
```

## Models

If we need to have logicful models then it's easy.

```typescript
import { Collection, ObjectId } from "@bluelibs/mongo-bundle";

class User {
  _id: ObjectId;
  firstName: string;
  lastName: string;

  get fullName() {
    return this.firstName + " " + this.lastName;
  }
}

// You can also use it as a type
class UsersCollection extends Collection<User> {
  static collectionName = "users";
  static model = User;
}
```

```typescript
// This will work with any finding queries
const user = usersCollection.queryOne({
  firstName: 1,
  lastName: 1,
});

user instanceof User;

user.fullName; // will automatically map it to User model class
```

Now, if you want to query only for fullName, because that's what you care about, you'll have to use expanders. Expanders are a way to say "I want to compute this value, not Nova, so when I request this field, I need you to actually fetch me these other fields and I'll take care of the rest."

```typescript
class UsersCollection extends Collection<User> {
  static collectionName = "users";
  static model = User;

  static expanders = {
    fullName: {
      firstName: 1,
      lastName: 1,
    },
  };
}
```

```typescript
const user = await usersCollection.queryOne({
  // fullName is an "expander"
  fullName: 1,
});

user instanceof User;

user.firstName; // will exist
user.lastName; // will exist
user.fullName; // will not exist.
```

However, you can also leverage Nova to do this computing via `reducers` for you like this:

```typescript
class User {
  _id: ObjectID;
  firstName: string;
  lastName: string;
  fullName: string; // no more computing
}

class UsersCollection extends Collection<User> {
  static collectionName = "users";
  static model = User;

  static reducers = {
    fullName: {
      dependency: {
        firstName: 1,
        lastName: 1,
      },
      reduce({ firstName, lastName }) {
        return this.firstName + " " + this.lastName;
      },
    },
  };
}
```

```typescript
const user = usersCollection.queryOne({
  fullName: 1,
});

user instanceof User;

user.firstName; // will NOT exist
user.lastName; // will NOT exist
user.fullName; // will be what you requested
```

## Transactions

If you want to ensure that all your updates are run and if an exception occurs you would like to rollback. For example, you have event listeners that you never want to fail, or you do multiple operations in which you must ensure that all run and if something bad happens you can revert.

```typescript
const dbService = container.get(DatabaseService);

await dbService.transact((session) => {
  await usersCollection.insertOne(document, { session });
  await postsCollection.updateOne(filter, modifier, { session });
});
```

The beautiful thing is that any kind of exception will result in transaction revertion. If you want to have event listeners that don't fail transactions, you simply wrap them in such a way that their promises resolve.

:::note
If you have event listeners inside the transaction and they perform custom operations, you can access the `session` variable from the event data.
:::

If you want to do a query with [Nova](/docs/package-nova), you can also pass the session as the second argument to the body:

```ts
await dbService.transact((session) => {
  await usersCollection.insertOne(document, { session });
  // works with query, queryOne, queryGraphQL, queryOneGraphQL
  await usersCollection.queryOne(
    {
      // your request body
    },
    session
  );
});
```

## Migrations

Migrations allow you to version and easily add new changes to database while staying safe. Migrations are added in the `prepare()` phase of your bundles.

```tsx
const migrationService = this.container.get(MigrationService);
migrationService.add({
  version: 1,
  name: "Do something",
  async up(container) {
    // Setup defaults for a certain collection
  },
  async down(container) {
    // Revert the up() function, in case something goes wrong and you want to rollback
  },
});
```

By default migrations are run by default to latest version right after `MongoBundle` gets initialised.

```ts
const migrationService = this.container.get(MigrationService);

new MongoBundle({
  uri: "...",
  // Take control and disable auto migration
  automigrate: false,
});

// Control it from here
migrationService.migrateToLatest();
migrationService.migrateTo(version);
```

The way we handle migrations is that we store in `migrations` collection a status object containing:

```ts
export interface IMigrationStatus {
  version: number; // The current version
  locked: boolean;
  lockedAt?: Date;
  lastError?: {
    fromVersion: number;
    message: string;
  };
}
```

## Meta

### Summary

The `MongoBundle` helps by offering having type-safety everywhere, to event-driven approach for working with documents, behaviors, integration with Nova, easy-to-use transactions and migrations. It provides a foundation for scalable code and is ofcourse used by the infamous [X-Framework](x-framework-introduction).

### Boilerplates

Create a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free instance of a database and you can use, make it open to all IPs and create a solid username and password and get the `Mongo URI`. You will most likely add it inside `src/constants.ts` file in the boilerplates.

- [MongoBundle Essential](https://stackblitz.com/edit/node-ebpceh?file=src%2Fsimple-collection-setup%2Findex.ts)

### Challenges

- How do you link two collections, what variables do you use inside the Collection? (1p)
- If you have a collection "tags" and another collection "posts" and posts have many tags and 2 posts can have the same tag, how do you link them together? (1p)
- How and when do I pass the `userId` if I want to benefit of blameable behavior? (1p)
- If you want to ensure absolute data-consistency at database-level what behavior would you use? (2p)
- Management calls. They must change the field in the database from "price" to "smallestPrice". What do you use to make that change? (2p)
- What is a reducer and what is the difference between reducer and links? (1p)
