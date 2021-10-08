## Install

```bash
npm i -S @bluelibs/security-bundle @bluelibs-security-mongo-bundle
```

```js
import { SecurityBundle } from "@bluelibs/security-bundle";
import { SecurityMongoBundle } from "@bluelibs/security-mongo-bundle";
import { MongoBundle } from "@bluelibs/mongo-bundle";

kernel.addBundles([
  // Make sure you have both security and mongo bundle in your kernel
  new SecurityBundle(),
  new MongoBundle({
    uri: "mongodb://localhost:27017/test",
  }),

  // Order doesn't really matter.
  new SecurityMongoBundle(),
]);
```

## Purpose

We need to blend `MongoBundle` which handles our connection to the database with `SecurityBundle` which is a database-agnostic to handle authentication, authorization and complex permissioning.

We are doing this by creating 3 the persistance layers (users, sessions, permissions) into their `MongoDB` collections

## Customise

You can opt-out of certain collections, or bring your own collection to the picture:

```ts
import { UsersCollection } from "./app/Users.collection.ts";

const kernel = new Kernel({
  bundles: [
    // the rest
    new SecurityMongoBundle({
      // override one (example below)
      usersCollection: UsersCollection,
      // cancel storing one
      sessionsCollection: null,
      // permissionsCollection remaining
    }),
  ],
});
```

:::note
The usecase for `null`ifying is for example if you want to use Redis, you would create a custom persistance layer
which you set in `SecurityBundle`, and you don't want this bundle to perform any modifications to use its `MongoDB` one.
:::

Accessing the `MongoBundle` collections, for raw access to your data:

```ts
import {
  UsersCollection,
  SessionsCollection,
  PermissionsCollection,
} from "@bluelibs/security-mongo-bundle";

const usersCollection = container.get(UsersCollection);
const sessionsCollection = container.get(SessionsCollection);
const permissionsCollection = container.get(PermissionsCollection);
```

## Custom Users Collection

You have the option to make changes to your collection, for example if you user is linked to other collections or you simply want a different collectio name:

```typescript
import {
  UsersCollection as BaseUsersCollection,
  PermissionsCollection,
} from "@bluelibs/security-mongo-bundle";
import { IUser } from "@bluelibs/security-bundle";

class User extends IUser {
  _id: ObjectId;
  profileId: ObjectId;
}

export class UsersCollection extends BaseUsersCollection<User> {
  static collectionName = "users"; // override it, by default it's "users"

  static links = {
    profile: {
      collection: () => ProfilesCollection,
      field: "profileId",
    },
  };

  // static indexes = [];
  // you could override anything you wish
  // and make sure you pass this class to `SecurityMongoBundle()` options.
}
```

:::note
The pattern above is a very common scenario in almost every application, we recommend you start with it.
:::

```typescript
new SecurityMongoBundle({
  usersCollection: AppUsersCollection,
});
```

## Decoupling

If you have an independent bundle that works with `SecurityMongoBundle`, and you want to use the `UsersCollection`, but you don't know if other bundles have stored custom ones, and you would like to work with the default one, the solution is to use the provided tokens from `security-mongo-bundle`.

```ts
import {
  USERS_COLLECTION_TOKEN,
  PERMISSIONS_COLLECTION_TOKEN,
  SESSIONS_COLLECTION_TOKEN,
} from "@bluelibs/security-mongo-bundle";

// You have to check if it exists: container.has(USERS_COLLECTION_TOKEN)
// If as value we get passed null, we won't register such token inside the container
// And you have to verify for it
```

## Meta

### Summary

This joins `Security` with `Mongo` and gives you ability to customise it and do lots of nice things.

### Boilerplates

- COMMING SOON

### Challenges

- Create a project in which you add a link to the User to Posts (5p), insert data in the database
