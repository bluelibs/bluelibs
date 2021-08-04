The MongoBundle offers integration with MongoDB database by allowing you to hook into events, giving ability to work with model classes and add behaviors (such as timestampable, blameable). As well it is integrated with `@bluelibs/nova` package which allows extremely rapid queries for relational data.

```bash
npm install --save @bluelibs/mongo-bundle @bluelibs/nova
```

## Basic Setup

```js
import { MongoBundle } from "@bluelibs/mongo-bundle";

new MongoBundle({
  uri: "mongodb://localhost:27017/test",

  // Optional if you have other options in mind
  // https://mongodb.github.io/node-mongodb-native/3.6/api/MongoClient.html#.connect
  options: MONGO_CONNECTION_OPTIONS,
});
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

What's nice about this is that you can listen to all events for the operations you do strictly on the collection. If you do `usersCollection.collection.insertMany` the events won't be dispatched, but if you do `usersCollection.insertMany` it will.

Available events that can be imported from the package:

- BeforeInsertEvent
- AfterInsertEvent
- BeforeUpdateEvent
- AfterUpdateEvent
- BeforeRemoveEvent
- AfterRemoveEvent

They are very explicit and typed with what they contain, a sample usage would be:

```typescript
import { AfterInsertEvent } from "@bluelibs/mongo-bundle";

eventManager.addListener(AfterInsertEvent, async (e) => {
  if (e.collection instanceof PostsCollection) {
    // Do something with the newly inserted Post
    const postBody = e.data.document;
    const postId = e.data.result.insertedId;
  }
});

// or simply do it on postsCollection.localEventManager
```

Events should be attached in the `prepare()` phase of your bundle. The common strategy is by warming up a Listener, as described in the core.

Events also receive a `context` variable. Another difference from classic MongoDB node collection operations is that we allow a `context` variable inside it that can be anything. That variable reaches the event listeners. It will be useful if we want to pass things such as an `userId` if we want some blameable behavior. You will understand more in the **Behaviors** section.

If you want to perform certain actions for elements once they have been updated or removed (events: `AfterUpdateEvent` and `AfterRemoveEvent`) the solution is to get the filter and extract the `_id` from there.

## Integration with Nova

### Basics

For fetching we use [Nova](https://www.bluelibs.com/docs/package-nova). And the concept is simple:

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

Keep in mind that links are attached on `.collection` under the `Collection` class from `@bluelibs/mongo-bundle`, so if you want to use the methods of `query()` or `lookup()` from Nova:

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

### GraphQL

If you are looking to write a [Nova Query](https://www.bluelibs.com/docs/package-nova#graphql-integration) in your GraphQL resolvers you can do:

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

Now, if you want to query only for fullName, because that's what you care about, you'll have to use expanders. Expanders are a way to say "I want to compute this value, not Nova, so when I request this field, I need you to actually fetch me these other fields"

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
const user = usersCollection.queryOne({
  fullName: 1,
});

user instanceof User;

user.firstName; // will exist
user.lastName; // will exist
user.fullName; // will automatically map it
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
