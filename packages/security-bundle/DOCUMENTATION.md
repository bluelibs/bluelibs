## Install

```bash
npm install @bluelibs/security-bundle
```

## Purpose

Security is one of the most important aspects when it comes to developing web apps, the impact of bad security can be business-disruptive, this is why `Security` was one of those modules which took a lot of time to design and everything has been carefully designed to fit a wide palette of applications.

We wanted to create a module that is database agnostic and helps us with:

- Ability to create, enable/disable users
- Ability to create authentication sessions for users
- Ability to have dynamic fully-customisable authentication strategies (password, biometric, jwt, etc)
- Fully-featured Permissioning System with Permission Hierarchies.

This module works with any database and you can have different `persistence layers` for each: Users, Sessions, Permissions. For example once your application becomes very large, you might want to store your `Sessions` inside redis for its raw speed. This is done by simply changing an abstraction layer and not lay a single finger on your code, everything will work.

## Configuration

By default it uses an in-memory database as persistence for users/permission/sessions, which means that on every server-restart everything will be forgotten. Either implement your own persistence layers or use some pre-existing solution such as: [Security Mongo Bundle](/docs/package-security-mongo)

```typescript
import { SecurityBundle } from "@bluelibs/security-bundle";

new SecurityBundle({
  // The permission tree (more on it below), is how you configure the role hierarchy in your app
  permissionTree: {
    SUPER_ADMIN: {
      POST_ADMIN: 1,
    },
    POST_ADMIN: 1,
  },

  // Configure some default session attributes, like expiration and automated cleanup
  session: {
    expiresIn: "14d", // (zeit/ms format) How long to have by default an active session/
    cleanup: true, // Should we clean expired sessions from the database
    cleanupInterval: "7d", // (zeit/ms format) How frequently to do cleanup of expired sessions?
  },
});
```

## Persistence Layers

In our current bundle we refer to persistence layers, as the services which lets us find, insert, update and remove different aspects of our models `User`, `Permission`, `Session`.

You can specify these permission layers in the bundle's config:

```ts
import { SecurityBundle, IUserPersistance } from "@bluelibs/security-bundle";

class MyUserPersistence implements IUserPersistance {
  // all the methods to satisfy the IUserPersistance interface
}

new SecurityBundle({
  userPersistance: MyUserPersistence,
});

// OR

class AppBundle extends Bundle {
  async hook() {
    // You will hook into the BundleBeforePrepare event, for SecurityBundle
    // and you can call the designated methods:
    // .setUserPersistance(), .setSessionPersistance(), .setPermissionPersistance()
    //
    // You can see how `Security Mongo Bundle` does it.
  }
}
```

We do have it implemented for mongodb via `MongoBundle`. This is done in a separate bundle: [Security Mongo Bundle](/docs/package-security-mongo).

```js
import { MongoBundle } from "@bluelibs/mongo-bundle";
import { SecurityMongoBundle } from "@bluelibs/security-mongo-bundle";

kernel.addBundles([
  // order does not matter
  new SecurityBundle({}),
  new MongoBundle({
    uri: "mongodb://localhost:27017/app",
  }),

  // This bundle works together with MongoBundle
  // And it creates the mongo collections "users", "permissions", and "sessions"
  new SecurityMongoBundle(),
]);
```

If you later, for example, want to move sessions over to Redis, or something faster, you can easily override the bundle. One big advantage using this is that you are never locked-in, you can always swap things, we try as much as possible to depend on abstractions rather than implementations, but at the same time want to make it plug-in to just start playing with this.

```typescript
// This says, I'm not going to modify the "sessions" collection, I will not attach it to a MongoDB collection
// Allowing you to customise it on your own.
new SecurityMongoBundle({
  sessionsCollection: null;
})
```

And then you inject on the SecurityBundle, `setSessionPersistance()` your own adapter which implements `ISessionPersistance`.

## Users

The basic, stripped-down user interface looks something like this:

```typescript
export type UserId = number | string | ObjectId;

export interface IUser {
  _id?: UserId;
  // Is the user allowed to authenticate
  isEnabled: boolean;

  createdAt: Date;
  lastLoginAt?: Date;
  roles?: string[];
}
```

Since we are database agnostic, we currently allow the `UserId` to be string, number or `ObjectId` for MongoDB. Let's say we want the `IUser` to have a `name: string` as well. The recommended strategy is to extend the interface:

```ts title="defs.ts"
// Make sure this file gets imported
import "@bluelibs/security-bundle";

declare module "@bluelibs/security-bundle" {
  export interface IUser {
    name: string;
  }
}
```

Now we have added an extra variable to the user.

```typescript
const securityService = container.get(SecurityService);

const userId = await securityService.createUser({
  name: "Dámaso Alonso",
});
// Btw, this method also emits the UserAfterCreateEvent, so you can hook into it.

await securityService.updateUser(userId, {
  name: "Luis de Góngora",
});

await securityService.deleteUser(userId);

// Simple role handling (more in Permissioning section)
await securityService.setRoles(userId, ["ADMIN"]);
await securityService.getRoles(userId);
```

## Authentication

### Sessions

We need a way to identify users on all requests. For this we create a `session token` for each, which we verify with our `session` persistance layer.

This is how the session looks like:

```ts
// And session looks something like this, you can easily get the user
export interface ISession {
  token: string;
  userId: UserId; // string, number, ObjectId
  expiresAt: Date;
  data?: ISessionData; // additional metadata to store with the session. (extend the interface to add to it)
}
```

Let's say you want to clean-up sessions for the users, we offer two simple methods for this:

```typescript
// If you choose to suspend the user, you can also cancel all their active sessions:

const { sessionPersistanceLayer } = securityService;
await sessionPersistanceLayer.deleteAllSessionsForUser(userId);

// This is done automatically in a cronjob by the bundle. However you can opt-out of it by using `session:{ cleanup: false }` at `SecurityBundle` config level
await sessionPersistanceLayer.cleanExpiredTokens();
```

### Login, Logout

Let's have some fun and explore the login-logout system:

```typescript
const sessionToken = await securityService.login(userId, {
  expiresIn: "14d", // zeit/ms kind
  data: {
    // Other data you would like to store in the session, in a key-value pair
  },
});

// Now that we have the token, we can fetch the session
// Note that this isn't a simple fetch it can throw `SessionExpiredException` or `UserDisabledException`
const session = await securityService.getSession(sessionToken);
// If you want to fetch it without verification/validation, access the `sessionPersistanceLayer` property of SecurityService

// To logout use this simple method:
await securityService.logout(sessionToken);
```

As we've seen so far it's quite easy to create users and create sessions for them that we can identify.

### Strategies

How can we authenticate users from an `end-to-end` perspective? We have passwords, biometric data, github, google. There are many ways. Let's see how the `SecurityService` comes to our aid.

We introduce a new concept called `AuthenticationStrategy`, we are going to refer to it as `UAS`. What this means is that it allows you to work with the `UserPermissionPersistance` layer to store information associated to authenticating users. For example, when dealing with `password` authentication, we'll store a `hash` of that password. If we're dealing with `facebook` authentication, we'll store the `facebookProfileId` in the User somehow.

```typescript
import { SecurityService } from "@bluelibs/security-bundle";

const securityService = this.container.get(SecurityService);

// This creates or updates the "password" auth strategy UAS
await securityService.updateAuthenticationStrategyData(userId, "password", {
  username: "salvador@da.li"
  passwordHash: "######",
})

// The response of find will contain { userId, strategy: { username, passwordHash } }
const response = await securityService.findThroughAuthenticationStrategy("password", {
  // The filters we allow here are only "flat"-listed and equality
  username: "salvador@da.li",
});
response.userId; // the userId
response.strategy; // { username: "salvador@da.li", password: }


const response = await securityService.setAuthenticationStrategyData(userId, "password");
// Clear all data regarding this.
await securityService.removeAuthenticationStrategyData(userId, "password");
```

:::note
These strategies work perfectly well with any authentication mechanism. We have full support for passport, opening ourselves up to 500+ authentication strategies, which can make our life a breeze!
:::

## Permissioning

Let us introduce you to our little friends: `IPermission` and `PermissionService`:

```typescript
// This is how permission looks like:
export interface IPermission {
  userId: any;
  permission: string; // "ADMIN"
  domain: string; // A part of the app, or an entity "INVOICES"
  domainIdentifier?: string; // Typically a sub-part of the domain, maybe an `_id` or something else.
}
```

:::note
Each permission has a required `domain`, which you have to specify, by default we recommend you use the string "app", or the less-friendly-looking `PERMISSION_DEFAULT_DOMAIN` export from the `@bluelibs/security-bundle` package.
:::

### Adding and Removing

A permission in which the domain is `PERMISSION_DEFAULT_DOMAIN` is regarded as a `role`. When you read about user roles, they are just `permissions` on the `app` domain.

```ts
import { PermissionService } from "@bluelibs/security-bundle";

const permissionService = container.get(PermissionService);

// I give "ADMIN" rights on "app" domain to userId
await permissionService.add({
  userId,
  permission: "ADMIN",
  domain: "app",
});

await permissionService.remove({
  userId,
  permission: "ADMIN",
  domain: "app",
});
```

### Searching

`PermissionSearchFilter` is an interface which is like `IPermission` but everything is arrayify-able and optional:

```ts
export interface IPermissionSearchFilter {
  userId?: UserId | UserId[];
  permission?: string | string[];
  domain?: string | string[];
  domainIdentifier?: string | string[];
}
```

This type of search can aid us find permissions and verify if the user has them:

```ts
permissionService.has(permissionSearchFilter); // Promise<boolean>
permissionService.findPermissions(permissionSearchFilter); // Promise<IPermission[]>;
permissionService.findPermission(permissionSearchFilter); // Promise<IPermission[]>;
permissionService.findDomains(userId: UserId): Promise<string[]>;
```

:::note
Keep in mind that when you specify an array, you are specifying an `or` condition. The `userId`, `permission`, `domain` and `domainIdentifier` have an `and` condition to them. Giving you a lot of flexibility when it comes to advanced permissioning.
:::

Therefore, let's say if we want to verify if the employee has `MANAGER` permission on module `INVOICES` in your application:

```ts
await permissionService.has({
  userId: employeeId,
  domain: `INVOICES`,
  permission: `MANAGER`,
});
```

### Hierarchy

Let us secure a method: `viewSalary()` is only accessible by people with role `MANAGER` and `ADMIN`. How does the check look like?

```ts
if (hasRole("ADMIN") || hasRole("MANAGER")) {
  // do your thang
}
```

What if this is not scalable, and these conditions grow? You can most likely say that if there's something a `MANAGER` can do, definitely an `ADMIN` can do too. This would mean that `ADMIN` will have `MANAGER` under its hierarchy:

```typescript
// Ensure that all are unique
const Permissions = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
};

// You can also use enum, ensure that you use strings as values
// As your application will grow and you really don't want that hassle
enum Permissions {
  ADMIN = "ADMIN",
}

// leaves are marked as 1, value
const permissionTree = {
  [Permissions.ADMIN]: {
    [Permissions.MANAGER]: 1,
  },
};
```

Now all you have to do is store it in your `SecurityBundle`:

```ts
new SecurityBundle({
  permissionTree,
});
```

Now we have super powers, because, when we check `has()` if the user has only the `ADMIN` role, it will still return true for `MANAGER` role check:

```ts
await permissionService.has({
  adminUserId,
  permission: "MANAGER",
  domain: "app",
}); // true, because he's higher in the hierarchy
```

Let's go a little bit deeper. This can work on custom domains as well:

```ts
enum PermissionDomains {
  APP = "app",
  SALES = "sales",
}

const tree = {
  [Permissions.INVOICE_ADMIN]: {
    [Permissions.INVOICE_LIST]: 1,
    [Permissions.INVOICE_CREATE]: 1,
  },
};

// We run this check before we allow an invoice to be created
await permissionService.add({
  userId: invoiceAdminUserId,
  permission: "INVOICE_ADMIN",
  domain: PermissionDomains.APP,
});

await permissionService.has({
  invoiceAdminUserId,
  permission: "INVOICE_CREATE",
  domain: PermissionDomains.SALES,
}); // This will be false. Look at the: `domain`
```

:::note
Careful when performing checks or adding permissions to "domain". Domains are not transferable. If you are only working with "app" domain, it's best to use `roles` strategy.
:::

### Domains

The `domains` help us give rights differently to different sections of the app:

- `ADMIN` role on `ProjectManagement` section of your app.
- `MODERATOR` role on `BlogPost` section of your app

In the same breath you can also create a role with `app` domain, called `PROJECT_MANAGEMENT_ADMIN`.

Another level of abstraction that we are going to introduce is the `domainIdentifier`, which can help us give rights to certain objects in your database:

- `ADMIN` role on `Post` domain with `postId` as the **domainIdentifier**.

```typescript
const tree = {
  admin: {
    viewer: 1,
  },
};

// We now add some roles ("admin" on "finance")
await permissionService.add({
  userId,
  permission: "admin",
  domain: "finance",
});

// "viewer" on "marketing"
await permissionService.add({
  userId,
  permission: "viewer",
  domain: "marketing",
});

// **true** because user is "admin" on "finance" and "viewer" is under "admin"'s hierarchy
await permissionService.has({
  userId,
  permission: "viewer",
  domain: "finance",
});

// **false** because user is only "viewer" on "marketing"
await permissionService.has({
  userId,
  permission: "admin",
  domain: "marketing",
});
```

And for the domain identifier the logic is very similar. Let's say we have "Groups":

```typescript
await permissionService.add({
  userId,
  permission: "viewer",
  domain: "groups",
  domainIdentifier: groupId, // ensure .toString() it if it's an ObjectId
});

// **true**
await permissionService.has({
  userId,
  permission: "viewer",
  domain: "groups",
  domainIdentifier: groupId,
});

// **false**, your permission is domainIdentifier bound
await permissionService.has({
  userId,
  permission: "viewer",
  domain: "groups",
});
```

:::note
Here's a catch. When dealing with domain identifiers, having a permission on the top domain without a domain identifier, means that you have those permissions over every other identifier:

```ts
await permissionService.add({ userId, permission: "view", domain: "invoices" });
await permissionService.has({
  userId,
  permission: "view",
  domain: "invoices",
  domainIdentifier: "INVOICE-0001",
}); // This will be true.
```

This allows you to have very verbose an explicit permissioning rules: Someone wants to download invoice as pdf? We check the permission on that invoice. You happen to be someone with "view" on all invoices? Perfect I will allow you.
:::

You may want to see all users who are viewers of `Domain.Groups` with that specific `groupId`:

```typescript
permissionService.findPermissions({
  domain: "app",
  // optional
  domainIdentifier: groupId,
});
```

### Roles

We call "role" a permission which is on `app` domain and has no `domainIdentifier`. The roles are typically stored under an array of strings under `user: { roles: [] }` but it can also be stored under permission collection as they normally are. It's your choice: the system works with both options, but for consistency it's best to just stick to one that fits best.

```ts
import { SecurityService } from "@bluelibs/security-bundle";

const securityService = container.get(SecurityService);
const roles = await securityService.getRoles(userId);
await securityService.setRoles(userId, ["ROLE1", "ROLE2"]);
```

Roles works with hierarchy seamlessly. To check if the user has a role and also be `hierarchy` aware:

```ts
const permissionService = container.get(PermissionService);

// Because the domain is "app", and no identifier. This will also check under `user.roles` to see if matches
const hasRole = permissionService.hasRole(userId, "ROLE1"); // works with array of strings too

// ^ Is a placeholder for the below code:
const hasRole = permissionService.has({
  userId,
  permission: "ROLE1",
  domain: "app",
});
```

The `IUser` interface has by default a `roles: string[]` property. And these `roles` are regarded as permissions on the `PERMISSION_DEFAULT_DOMAIN`.

```ts
const userId = await securityService.createUser({
  roles: ["ADMIN"],
});

await permissionService.hasRole(userId, "ADMIN");
```

:::warning
We decided to use `roles` at User level because there was a plethora of applications which have simple permissioning system. Roles can be used as employee roles: `HR Manager`, `Developer`, etc or as permissioning sets `SALARIES_VIEW`, etc.

If you want a scalable system we recommend you separate the "actor role" in the application and use permissioning sets(`SALARIES_VIEW`, `USERS_ADD`), later down the road you can group these and benefit of Permissioning Hierarchy.
:::

The strategy mentioned above means that you will not interact with `permissionService` to mutate data (it's just an array of strings at `User` level). If you choose to work with `permissionService` (to add or remove) ensure that all your role management is done through it, because when we perform the `has()` role verification, we also take into consideration `user.roles` to apply to our dataset.

This means that if you want to switch and will be dealing with `roles` manipulation through `add(), remove()` inside `PermissionService`, ensure that `user.roles` is an empty array and don't touch it again, because `Permissions` is in its own persistance layer. We offered `roles` at `User` level to offer a simple, scalable and powerful way to deal with permissions, but at the same time offer the possibility to trully scale your permissioning system without hassles.

## Events

You can hook into multiple type of events, you can find them by exploring the API or just looking into `events.ts` file.

Their names should be intuitive enough and you can import them directly from "@bluelibs/security-bundle" package:

- UserBeforeCreateEvent
- UserAfterCreateEvent
- UserBeforeUpdateEvent
- UserAfterUpdateEvent
- UserBeforeDeleteEvent
- UserAfterDeleteEvent
- UserBeforeLoginEvent
- UserAfterLoginEvent
- UserBeforeLogoutEvent
- UserAfterLogoutEvent
- UserDisabledEvent
- UserEnabledEvent
- UserBeforeAddPermissionEvent
- UserAfterAddPermissionEvent
- UserBeforeRemovePermissionEvent
- UserAfterRemovePermissionEvent
- SessionRetrievedEvent
- SessionBeforeCreateEvent
- SessionAfterCreateEvent

## Meta

### Summary

There we have it. A powerful security module with lots of goodies, flexible to the bone, event-driven and ready to be used as the guardian of your application.

### Boilerplates

- [Standard Security Boilerplate](https://stackblitz.com/edit/node-3yzakh?file=src%2Findex.ts)

### Challenges

1. Try to implement a password authentication strategy. (1p)
2. What is a role? What is a domain? What is a domain identifier? (1p)
3. If I have a permission on a domain, would I have the same permission on every domainIdentifier from that domain? (2p)
4. Can I have users stored in MongoDB, sessions stored on Redis and Permissions in Neo4J? (1p)
5. What happens with expired sessions? (2p)
6. What are the benefits of having session-based authentication? (1p)
7. When should we stop storing `roles` under `User` ? (4p)
