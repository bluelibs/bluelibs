This bundle aims to solve Authentication and Authorization (with included Permission Management & Permissioning Tree Hierarchy) while being fully decoupled from a persistence layer (Database), meaning you can implement your own persistence layers to work with any type of database/API.

It solves the following:

- Ability to create users
- Ability to create session for users
- Ability to attach several authentication strategies for users
- Ability to manage (add/remove) permissions in multiple dimensions
- Ability to enable/disable certain users

By default it uses an in-memory database for storing users/permission/sessions, which means that on every server-restart everything will be forgotten. Either implement your own persistance layers either use some already done such as: [Security Mongo Bundle](https://github.com/bluelibs/security-mongo-bundle)

## Install

```bash
npm install @bluelibs/security-bundle
```

```typescript
import { SecurityBundle } from "@bluelibs/security-bundle";

kernel.addBundle(new SecurityBundle({}));
```

The configuration that can be passed to the bundle:

```typescript
export interface ISecurityBundleConfig {
  // Any class which properly implements IUserPersistance
  // Used for managing user's persistence
  userPersistance?: Constructor<IUserPersistance>;
  // This manages sessions (once logged in you get a session token that is used to identify you)
  sessionPersistance?: Constructor<ISessionPersistance>;
  // This manages permission storage
  permissionPersistance?: Constructor<ISessionPersistance>;

  // The permission tree (more on it below), is how you configure the role hierarchy in your app
  permissionTree?: IPermissionTree;

  // Configure some default session attributes, like expiration and automated cleanup
  // You can opt-in to do your own manual cleanups for expired tokens
  session?: {
    expiresIn?: string;
    cleanup?: boolean;
    cleanupInterval?: string; // zeit/ms format
  };
}
```

## Persistance Layers

So, in our current bundle we refer to persistence layers, as the services which lets us find, insert, update and remove different aspects of our models `User`, `Permission`, `Session`.

Currently, our recommended implementation for MongoDB here:

```js
import { MongoBundle } from "@bluelibs/mongo-bundle";
import { SecurityMongoBundle } from "@bluelibs/security-mongo-bundle";

kernel.addBundles([
  // order does not matter
  new SecurityBundle(options),
  new MongoBundle({
    uri: "mongodb://localhost:27017/app",
  }),

  // This bundle works together with MongoBundle
  // And it creates the collections "users", "permissions", and "sessions"
  new SecurityMongoBundle(),
]);
```

If you later, for example, want to move sessions to redis, or something faster, you can easily override the bundle. One big advantage using this is that you are never locked-in, you can always swap things, we try as much as possible to depend on abstractions rather than implementations, but at the same time want to make it plug-in to just start playing with this.

```typescript
new SecurityMongoBundle({
  sessionsCollection: null;
})
```

And then you inject on the SecurityBundle, setSessionsPersistance() your own adapter which implements ISessionPersistance

## Creating and Authenticating Users

The basic, stripped-down user interface looks something like this:

```typescript
export interface IUser {
  _id?: any;
  // Is the user allowed to authenticate
  isEnabled: boolean;

  createdAt: Date;
  lastLoginAt?: Date;
}
```

When we create an user we allow to insert any

```typescript
const securityService = container.get(SecurityService);

const userId = await securityService.createUser();

// Extend the interface if you want to allow setting extra fields
interface IUser {
  name: string;
}

await securityService.updateUser(userId, {
  name: "New Name",
});

await securityService.deleteUser(userId);
```

Now, let's authenticate the user, shall we?

```typescript
const sessionToken = await securityService.login(userId, {
  expiresIn: '14d' // zeit/ms kind
  data: {
    // Other data you would like to store in the session, in a key-value pair
  }
});

// Now that we have the token, we can fetch the session
const session = await securityService.getSession(sessionToken);

// And session looks something like this, you can easily get the user

export interface ISession {
  token: string;
  userId: any;
  expiresAt: Date;
  data?: any;
}

// And simply remove the token when you want the user to logOut
await securityService.logout(sessionToken);
```

There are other helpful methods that you can use with `SecurityService`, and you can also do things like:

Log out all the users, not a specific token:

```typescript
const { sessionPersistanceLayer } = securityService;
await sessionPersistanceLayer.deleteAllSessionsForUser(userId);
```

Clean expired tokens. You may want to introduce this in your cronjob bundle, but worry not this is done by default if you don't specify `cleanup: false` in the bundle configuration.

```typescript
await sessionPersistanceLayer.cleanExpiredTokens();
```

## Authentication Strategies

Alright. We are doing authentication, but based on what? Well, we have passwords, biometric data, github, google. There are many ways to authenticate users. Let's see how the security service comes in our aid.

Firstly, we expose methods of searching and manipulating authentication strategy data in our `SecurityService`:

```typescript
  // Update is also considered "creation"
  updateAuthenticationStrategyData(
    userId: any,
    strategyName: string,
    data: object
  ): Promise<void>;

  // Searches by the data stored in authentication strategy's object
  findThroughAuthenticationStrategy<T = any>(
    strategyName: string,
    filters, // These filters refer to the `data` object
    fields?: IFieldMap
  ): Promise<FindAuthenticationStrategyResponse<T>>; // Returns userId and strategy with the data

  getAuthenticationStrategyData(userId: any, strategyName: string): Promise<any>;
  removeAuthenticationStrategyData(userId: any, strategyName: string): Promise<any>;
```

So, we attach to user an authentication strategy, and it's up to the persistance layer how to store it, we just need a way to find the user by fields equality in that data, and update that data.

Based on this you can have an authentication strategy called "password", and inside this strategy you store things such as `passwordHash` and `username` and others. And when an authentication is tried, you can fetch let's say the user by username which you also store in that strategy (via `findThroughAuthenticationStrategy("password", { username })`). And you can access the user's password hash, if it matches, you create a session and attach it to that user.

The concept is pretty simple, and what is beautiful is that:

1. It's completely flexible. We don't say how you should structure your strategies or force you into our abstractions.
2. If, in time, we have 50 authentication strategies open-sourced that use this bundle, you basically can switch to any database without reinventing the wheel.

## Permissions

We dealt with authentication now let's deal with authorization. We had to solve some interesting problems, first we needed a permission "tree" that would allow us to easily to authorise persons based on an hierarchy.

For example, let's say we have "Posts" collection, and we have `POST_ADMINISTRATOR` permission, and we have a `SUPER_ADMINISTRATOR` permission. In theory, the `SUPER_ADMINISTRATOR` can do anything so you will be tempted to check the condition like this:

```typescript
if (hasAdministratorRole() || hasPostAdministratorRole()) {
  // NOT GOOD
}
```

So we need an hierarchy, let's construct it, make it a bit more complex so we better illustrate the idea.

```typescript
// Ensure that all are unique
const Permissions = {
  Administrator: "ADMINISTRATOR",
  PostAdministrator: "POST_ADMINISTRATOR",
  PostListView: "POST_LIST_VIEW",
  PostEdit: "POST_EDIT",
};

// You can also use enum, but we also prefer you use strings instead of numeric values
// As your application will grow and you really don't want that hassle
enum Permissions {
  Administrator = "ADMINISTRATOR",
}
```

Now that we defined our permissions, let's define the tree:

```typescript
// Shorthand
const $ = Permissions;

const PermissionGraph = {
  // $.Administrator === Permissions.Administrator ===
  [$.Administrator]: {
    [$.PostAdministrator]: 1,
  },
  [$.PostAdministrator]: {
    [$.PostListView]: 1,
    [$.PostEdit]: 1,
  },
};
```

Now what would be really cool, is that no matter what role you have either `Administrator`, `PostAdministrator`, if now you want to check `PostEdit` it should work. This is the beautiful thing. It acts as a graph, but think of it as a tree, but you may find yourself in strange situations so it supports recursive dependencies and many more.

Let's introduce our friend the `PermissionService`:

```typescript
add(permission: IPermission): Promise<void>;
remove(filter: PermissionSearchFilter): Promise<void>;
has(permission: IPermission): Promise<boolean>;
findPermissions(filter: PermissionSearchFilter): Promise<IPermission[]>;
findPermission(filter: PermissionSearchFilter): Promise<IPermission[]>;
findDomains(userId: any): Promise<string[]>;

// And the permission looks like this:
export interface IPermission {
  userId: any;
  permission: string; // "Administrator"
  domain: string;
  domainIdentifier?: string;
}
```

It seems pretty straight-forward. You add permissions, remove them, and test if it has them.

```typescript
import { PermissionService } from "@bluelibs/security-bundle";

const permissionService = container.get(PermissionService);

await permissionService.add({
  userId: "xxx",
  permission: $.PostAdministrator,
  domain: "app", // "app" or the PERMISSION_DEFAULT_DOMAIN from this package
});

await permissionService.has({
  userId: "xxx",
  permission: $.PostListView,
  domain: "app",
}); // true, the graph is constructed

await permissionService.remove({
  userId: "xxx",
  permission: $.PostListView,
  domain: "app",
});
```

You may find it cumbersome that you have to specify this "domain" everytime. We tried defaulting it for you, the reason why we chose to enforce it is that if we make it optional it can create a lot of confussion when working with domain-bound expressions and searching for permissions will result in unexpected, unpredictable, non-intuitive behaviors.

If you only work with app-level bound permissions, you can easily create your own service that defaults it for you.

### Dimensions

The `domains` help us give rights differently to different sections of the app:

- `ADMIN` role on `ProjectManagement` section of your app.
- `MODERATOR` role on `BlogPost` section of your app

In the same breath you can also create an `app-level` called ProjectManagementAdmin. When to split it through domains is when you want to re-use the hierarchical logic which in most cases it's the same. Especially for CRUD-like things.

Another level of abstraction that we are going to introduce is the `domainIdentifier`, which can help us give rights to certain objects in your database:

- `ADMIN` role on `Post` domain with `postId` as the **domainIdentifier**.

```typescript
// Sample Tree
// This tree is not domain-bound. In the rare case you have different trees based on your domains you can use different prefixes/names for it, or just implement your custom permissioning services.
{
  $.Admin: {
    $.Viewer: 1,
  }
}

// We now add some roles
await permissionService.add({
  userId,
  permission: $.Admin,
  domain: "finance",
});

await permissionService.add({
  userId,
  permission: $.Viewer,
  domain: "marketing",
});

// True because he is Admin on "finance"
await permissionService.has({
  userId,
  permission: $.Viewer,
  domain: "finance"
})


// False because he is only Viewer on "marketing"
await permissionService.has({
  userId,
  permission: $.Admin,
  domain: "marketing"
})
```

And for the domain identifier the logic is very similar. Let's say we have "Groups":

```typescript
await permissionService.add({
  userId,
  permission: $.Viewer,
  domain: "groups",
  domainIdentifier: groupId,
});

// True
await permissionService.has({
  userId,
  permission: $.Viewer,
  domain: "groups",
  domainIdentifier: groupId,
});

// False, your permission is domainIdentifier bound
await permissionService.has({
  userId,
  permission: $.Viewer,
  domain: "groups",
});
```

However, if you attach permission that is on domain "groups" it will translate as if it's there for _all_ domain identifiers.

You may want to see all users who are viewers of `Domain.Groups` with that specific `groupId`:

```typescript
permissionService.findPermissions({
  domain: Domains.Groups,
  domainIdentifier: groupId,
});
```

When searching/removing/(using has), you can filter by all 4 dimensions:

- userId
- permission
- domain
- domainIdentifier

If you specify an array then it'll find all the elements matching that array:

```js
{
  userId: [user1Id, user2Id];
}
// Will return all permissions belonging to user1Id and user2Id
// The others aren't specified so they can be anything
```

### Roles

We call "role" a permission which is on `app` domain and has no `domainIdentifier`. The roles are typically stored under an array of strings under `user: { roles: [] }` but it can also be stored under permission collection as they normally are. It's your choice, the system works with both options, but for consistency it's best to just stick to one that fits best.

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
