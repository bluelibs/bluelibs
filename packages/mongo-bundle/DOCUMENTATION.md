## Install

```bash
npm install --save @bluelibs/mongo-bundle @bluelibs/nova
```

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

## Collections

A collection is in fact a service. Thus making it accessible via the `container`. We define our collections as extensions of `Collection` in which we can customise things such as: `collectionName`, `indexes`, `links`, `reducers`, `behaviors`.

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

We've opted for `static` definition instead of the `abstract` approach of methods because static variables can be manipulated with ease, so for example if you have a collection from a bundle, and you would simply want to rename the collection name, or add another index, relation, or behavior, doing this is trivial. We understand that the abstract methods can hold certain advantages however because of the freedom these static variables offer we chose them.

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

```yaml
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
  - isMany (if it's a removeMany());
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

## Integration with Nova

We need a way to link collections and fetch data with blazing fast speeds. For this purpose, [Nova](package-nova) comes to the rescue and we strongly recommend you read through it first to get all the concepts clarified.

Nova is extremely fast and gives us the freedom to think relational in NoSQL, enhancing our developer experience.

### Basics

```typescript
// Fetch it from the container
const usersCollection = container.get(UsersCollection);

usersCollection.query({
  $: {
    filters: {
      _id: someUserId
    }
  }
  // Specify the fields you need
  firstName: 1,
  lastName: 1,
});

// use .queryOne() if you are expecting a single result based on filters
```

To integrate with Nova, you can do it via the following static variables

```typescript
class UsersCollection extends Collection {
  static collectionName = "users";
}

class PostsCollection extends Collection {
  static collectionName = "posts";

  static links = {
    user: {
      collection: () => UsersCollection,
      field: "userId",
    },
  };

  // Nova reducers
  // Note: reducers include "container" in the context property of their params.
  static reducers = {};

  // Nova expanders
  static expanders = {};
}
```

Now you can query freely:

```typescript
postsCollection.query({
  title: 1,
  user: {
    firstName: 1,
    lastName: 1,
  },
});
```

:::note
Keep in mind that links are attached on `.collection` under the `Collection` class from `@bluelibs/mongo-bundle`, so if you want to use the methods of `query()` or `lookup()` from Nova.
:::

Using bare-bones `Nova`:

```ts
import { lookup, query } from "@bluelibs/nova";

const postsCollection = container.get(PostsCollection);
const results = query(
  postsCollection.collection,
  {
    $: {
      pipeline: [
        lookup(postsCollection.collection, "user"),
        // Note that we use .collection, because that's where links are attached.
      ],
    },
  },
  {
    // And if you have container aware reducers you have to pass the context here:
    container,
  }
);
```

If you want to benefit of JIT bson-decoding for your data you can add. This speeds up the data fetching speeds by ~30% (the more data you fetch, the faster it gets).

:::warning
Keep in mind that if you forget to update the `jitSchema` you won't be able to receive the data not defined in schema from MongoDB, making you wonder what is going on, we advise using this only when you actually need it. Prematurue optimisation is not healthy.
:::

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

If you are looking to write a [Nova Query](package-nova#graphql-integration), in your GraphQL resolvers you can do:

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
    },
  },
};
```

If you want the query to return a single element, a short-hand function is `postsCollection.queryOneGraphQL()`.

## Behaviors

The nature of the behavior is simple, it is a `function` that receives the `collection` object when the collection initialises. And you can listen to events on the collection and make it **behave**.

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

The `MongoBundle` helps us a ton, from having type safety, to event-driven approach for working with documents, behaviors, integration with Nova, easy-to-use transactions and migrations. It provides a foundation for scalable code and is ofcourse used by the infamous [X-Framework](x-framework-introduction).

### Boilerplates

Create a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free instance of a database and you can use. Boilerplates comming soon.

### Challenges

- How do you link two collections, what variables do you use inside the Collection? (1p)
- If you have a collection "tags" and another collection "posts" and posts have many tags and 2 posts can have the same tag, how do you link them together? (1p)
- How and when do I pass the `userId` if I want to benefit of blameable behavior? (1p)
- If you want to ensure absolute data-consistency at database-level what behavior would you use? (2p)
- Management calls. They must change the field in the database from "price" to "smallestPrice". What do you use to make that change? (2p)
- What is a reducer and what is the difference between reducer and links? (1p)
