## Purpose

The X-Framework Server is built with Node & TypeScript. It can be easily be deployed in many environments including serverless due to its very flexible nature.

It provides developers the ability to code rapidly and skip through a lot of configuration boilerplate for common scenarios when building apps:

- GraphQL Server Executors (CRUD Operations, Security Checks, Service Delegation)
- GraphQL Server Scalars (Date, ObjectId)
- A defined way for standard CRUD interfaces
- Validator Transformers (Date, ObjectId, UniqueDatabaseField)
- API and Web App Routers
- LiveData Support for [MongoBundle](package-mongo)

## Install

```
npm i -S @bluelibs/x-bundle
```

```ts title="kernel.ts"
import { XBundle } from "@bluelibs/x-bundle";

const kernel = new Kernel({
  bundles: [
    // You will also need to add other bundles here.

    new XBundle({
      // You should take these from environment, the reason we ask them is for easy routing
      // However, they are optional.

      // The URL of the application, your website (helpful for other bundles in the X-Framework ecosystem)
      appUrl: "http://localhost:3000",
      // The URL of the API endpoint
      rootUrl: "http://localhost:4000",
    }),
  ],
});
```

## Requirements

In order for you to have a smooth sailing down this road, you have to ensure that you are already familiar with our `Foundation` and some of the bundles we use. More information can be found inside [Introduction -> Learning Curve](x-framework-introduction#learning-curve)

## BaseBundle

All your `X-Framework` bundles most likely will extend `BaseBundle` from this package:

```ts
import { BaseBundle } from "@bluelibs/x-bundle";

class AppBundle extends BaseBundle {
  async prepare() {
    this.setupBundle({
      // collections?: Record<string, any>;
      // listeners?: Record<string, any>;
      // serverRoutes?: Record<string, any>;
      // validators?: Record<string, any>;
      // fixtures?: Record<string, any>;
      // graphqlModule?: any | any[];
    });
  }
}
```

## Executors

Because our [resolvers can be chains of functions](package-graphql#resolvers), we have created a set of them that allow us to easily operate within X-Framework and do things from fetching stuff from database to securing the request and even delegating to other services.

### Database Queries

We use MongoDB Nova for fetching relational data. The [Nova](package-nova) package has a way to transform a GraphQL request into a Nova request automatically fetching relations without any additional code.

```ts
import * as X from "@bluelibs/x-bundle";


export default {
  typeDefs: /* GraphQL */`
    type User {
      name: String!
      age: Int
    }

    type Query {
      users: [User]!
    }
  `
  resolvers: {
    Query: {
      // or X.ToNovaOne() for single element result
      users: X.ToNova(UsersCollection),
    },
  }
};
```

We can also pass an additional resolver function which [returns an object](package-nova#graphql-integration) containing optiosn for securing your request. More details can be [found here](package-nova#graphql-integration).

```ts
import { IAstToQueryOptions } from "@bluelibs/nova";

[
  X.ToNova(CollectionClass, async (_, args, ctx, info) => {
    // Should return IAstToQueryOptions
    return {
      intersect: {
        fieldName: 1,
        relation1: {
          relationField: 1,
        },
      },
      // Enforce other rules like:
      maxLimit: 100,

      // How deep the graph request should go?
      maxDepth: 5,

      // Use MongoDB filters and options for first level collection flitering:
      filters: {},
      options: {},
    };
  }),
];
```

A common scenario is to get a User by its id, let's see how that would look like:

```ts
export default {
  typeDefs: `
    type Query {
      getUser(_id: String!): User
    }
  `,
  resolvers: {
    Query: {
      getUser: X.ToNovaOne(UsersCollection, async (_, args) => {
        return {
          filters: {
            _id: args._id,
          },
        };
      }),
    },
  },
};
```

Counting operations can be useful for paginated interfaces:

```ts
[
  X.ToCollectionCount(CollectionClass, (_, args) => ({
    // Here are filters returned, you can also read them from args if you prefer
    status: "approved",
  })),
];
```

If we want to ensure that a certain document exists in the database before allowing the request to continue:

```ts
[
  // The second argument needs to return an _id
  // By default _id from args is taken like below
  X.CheckDocumentExists(CollectionClass, (_, args, ctx, info) => args._id),

  // If it does not exist in the database it will throw this exception: DocumentNotFoundException from @bluelibs/mongo-bundle
];
```

### Database Mutations

GraphQL has queries but also mutations, for inserting, updating and deleting a document. Below we'll explore practical ways of leveraging this logic, but also keeping us very flexible.

Assuming we have the following type set:

```graphql
type Post {
  _id: ObjectId!
  title: String!
}

input PostNewInput {
  title: String!
}

type Query {
  insertSomething(post: PostNewInput): Post
  updateSomething(_id: ObjectId, dataSet: JSON): Post
  deleteSomething(_id: ObjectId): Boolean
}
```

Now let's insert, update and remove some data, note that what we see below are simply resolvers:

```ts
const insertSomething = [
  // The second argument is what object to insert, in our case "post"
  X.ToDocumentInsert(CollectionClass, "post"),

  // Because we return a `Post` from the insertion:
  // This one takes the returned _id from the above executor, and transforms it into a Nova query
  // So you can easily fetched the newly created document
  X.ToNovaByResultID(CollectionClass),
];

const updateSomething = [
  // By default if you use the default one dataSet, it uses "$set" to update the provided data.
  X.ToDocumentUpdateByID(CollectionClass),
  // ^ Update accepts to arguments after collection: idResolver and mutationResolver which get `args` as their argument and return an _id and subsequently a "mutation" query:

  // Return the object by _id
  X.ToNovaByResultID(CollectionClass),
];

const deleteSomething = [X.ToDocumentDeleteByID(CollectionClass, idResolver)];
```

What we see above can be easily updated, in essence, they're just doing basic stuff for you, you could easily do:

```ts
const insertSomething = [
  async (_, args, ctx) => {
    const { container } = ctx;
    const collection = container.get(CollectionClass);

    await collection.insertOne({
      /* your custom options here */
    });
    // you can do update, delete, whatever
  },
];
```

:::note
Whenever it feels hard or inconvenient to use this executors, just opt-out of them, they aren't designed to be very smart or adaptable. Move your logic into specialised services so that they can be easily tested.
:::

### Logging

Whether you have mission critical queries/mutations in which you need logs for those actions or you simply want to debug the responses and requests much easier. You can use the following:

```ts
[
  // Requests should be added before your actual mutation
  X.LogRequest(),
  // Prints the arguments as JSON.stringified for full display
  X.LogRequestJSON(),

  // Logs the response and sends the result down the line
  X.LogResponse(),
  X.LogResponseJSON(),
  // You can put these logs at any stage in your pipeline
];
```

:::note
These executors make use of the [LoggerBundle](package-logger) to send out the logs, meaning you can even send them to your central log management service without changing a line in the future.
:::

### Models & Validation

The arguments of GraphQL are objects, so it would be nice if we can easily transform them into models so we can "enhance" their functionality so-to-speak but more importantly to have them easily validatable. We will be using the [BlueLibs's validator package](https://bluelibs.com/docs/package-validator) We propose the following solution:

```ts
@Schema()
class User {
  @Is(a.string().required())
  firstName: string;

  @Is(a.string().required())
  lastName: string;

  get fullName() {
    return this.firstName + " " + this.lastName;
  }
}
```

```graphql
type User {
  firstName: String!;
  lastName: String!
  fullName: String!
}
```

```ts
[
  // The second argument refers to the argument's name that you want to transform
  // If you maintain the pattern and name all of them "input", the second argument is optional.
  X.ToModel(User, "input"),
  // Input now becomes a model instance of `User` class.

  // Throws exception of `ValidationError` default field is input either way.
  X.Validate({ field: "input" })
  async (_, args, ctx) => {
    const user = args.input; // user instanceof User === true
  }
];

// The above code translated in most commonly used fashion:
[
  X.ToModel(User),
  X.Validate(),
  // To database insert or custom function
]
```

The `ToModel` is a bit primitive, because it uses `toModel()` from [EJSON](package-ejson#models). Meaning it will not work with transforming nested models into instances of their class, but it will work with validating nested models.

If you are looking to something more advanced you can look at: [class-transformer](https://github.com/typestack/class-transformer), [@deepkit/type](https://deepkit.io/documentation/type/schema).

And you could write your own executor:

```ts
import { GraphQLResolverType } from "@bluelibs/graphql-bundle";

const AppToModel: GraphQLResolverType = async (_, args, ctx) => {
  args.input = plainToClass(User, args.input);
};
```

Validation uses [ValidatorBundle](package-validator-bundle) to do its magic. You are also able to pass additional options to validation:

```ts
[
  X.ToModel(User),
  X.Validate({
    // These can be found on yup, they are the same.
    strict: true,

    // To give you everything wrong with the User and not throw on first error found:
    abortEarly: false,
  }),
];
```

### Security

Security is a bit tricky, especially with GraphQL, you can be attacked from the following points:

- (DATA ABYSS) Overloading your Graph because you have highly interlinked data and no deepness limitation
- (DATA BREACH) Exposing unwanting data due to the way you link data in your Graph and not limiting the request
- (SANE LIMITATIONS) Limiting number of requests per second from a given person to avoid abuses.

For each of this problem you need to employ different solutions, luckily, `X-Framework` has been designed with these in mind and we offer you the tooling to get past them with ease.

We should be able to quickly check if a user is logged in or has certain permissions:

```ts
[
  // Check if the user is logged in, throws if not
  X.CheckLoggedIn(),
  X.CheckPermission("ADMIN"),
  // or multiple roles
  X.CheckPermission(["USER", "SUPER_USER"])
  // or custom so you can customise domain and others
  X.CheckPermission((_, args, ctx) => {
    // Returns a permission filter
    return {
      userId: ctx.userId,
      domain: "Projects",
    }
  })
]

// The permission search looks like this.
interface IPermissionSearchFilter {
    userId?: any | any[];
    permission?: string | string[];
    domain?: string | string[];
    domainIdentifier?: string | string[];
}
```

Security is not always simple and straight forward, but there are very common scenarios for securisation and we'll explore them below inside `X.Secure`:

A common scenario is this:

- First we match the user to see what rules to apply
- We run the rules and if any throws an exception we stop executing the request
- If there's no match it throws
- Once the first match is found the others are ignored
- The rules (end-statements) themselves can return data.

#### Finding Data

- Check if the user has any specific roles
- Apply a set of filters to the requested data

```ts
[
  X.Secure([
    {
      // This states: if the user is ADMIN, don't have additional filtering or rules
      // Matches are resolver-like functions, you could implement your own.
      match: X.Secure.Match.Roles("ADMIN"),
    },
    {
      match: X.Secure.Match.Roles([
        "PROJECT_MANAGER",
        "PROJECT_DELIVERY_MANAGER",
      ]),
      run: [
        // You can intersect the GRAPHQL request. Optionally provide the type <User> for autocompletion.
        // Note that contrary to `intersect` from Nova this will throw an error.
        X.Secure.Intersect<User>({}),

        // Optionally apply certain filters when X.ToNova() is used below X.Secure()
        // The filters returned here also apply X.ToCollectionCount()
        X.Secure.ApplyNovaOptions({
          filters: {
            isApproved: true,
          },
        }),
        // Note: you can also use the filters as a resolver function if you want full customisation of filters based on userId or others

        // Note that you can also have the ability of returning the data here.
      ],
    },
  ]),
];
```

#### Mutating Data

- Check if the user has any specific roles
- Check if the user is an owner to this document or has the propper roles

```ts
[
  X.Secure([
    {
      // This states: if the user is ADMIN, don't have additional filtering or rules
      match: X.Secure.Match.Roles("ADMIN"),
    },
    {
      match: X.Secure.Match.Roles([
        "PROJECT_MANAGER",
        "PROJECT_DELIVERY_MANAGER",
      ]),
      // Let's apply some rules when we're doing update or remove
      run: [
        // Checks if the current user owns the Post by equality matching ownerId
        // The _id represents the key of the _id extracted from arguments
        X.Secure.IsUser(PostsCollection, "ownerId", "_id"),
        // Note: this works when you also have ownersIds as the equality is done through $in via MongoDB
      ],
    },
  ]),
];
```

You can also have fallback rules that contain no `match`, when there is no `match` we assume it's a fallback:

```ts
[
  X.Secure([
    {
      match,
      run: [],
    },
    {
      // An anonymous user for example
      run: [],
    },
  ]),
];
```

### Services

As we know, our logic should be stored in the Service Layer instead of the resolvers, this is why we recommend for custom logic that cannot be satisfied through some useful executors, to delegate to your service.

```ts
[
  X.ToService(ServiceClass, "method")
  // By default it transmits to "method" args.input and userId

  // However you can create your own mapper that returns an array of arguments
  // That will be applied properly
  X.ToService(ServiceClass, "extended", (args, ctx, ast) => ([
    args, ctx
  ]))
]
```

```ts
import { Service } from "@bluelibs/core";

@Service()
class ServiceClass {
  async method(input, userId) {
    // Code goes here
  }

  async extended(args, fullContext) {
    // Code goes here
  }
}
```

## Scalars

We provide the following scalars

### ObjectId

This will transform the ObjectId into a string and from a string to an ObjectId from bson, compatible with MongoDB. It uses `ObjectId` from `@bluelibs/ejson`.

### EJSON

We will use `EJSON` as a mechanism to allow rich data to be sent, including Dates, ObjectIds, RegEx and other fine ones.

What it does is pretty simple, it converts to ObjectId the strings it receives from GraphQL so it's easy for you to do searching and other cool stuff without worrying about it.

## Validators

### DateTransformer

Sometimes we want from users the date as a string instead of timestamp because it might lead to different timezone issues. If you plan on receiving the date in a string format such as "YYYY-MM-DD", then it would be helpful to have it ready as a Date when you want to use it:

```graphql
type Post {
  publishedAt: Date
}

input PostInput {
  # Note the String! not Date!
  # If you wanted a Date! input, you should send the `timestamp` as a number for that field and it will be automagically transformed
  publishedAt: String!
}
```

```ts
@Schema()
class Post {
  // More about formats here: https://date-fns.org/v2.14.0/docs/format
  @Is(a.date().format("YYYY-MM-DD"))
  publishedAt: Date;
}
```

Now if you send it as a string, after it passes validation it will be a Date object. (`[ X.ToModel(Post), X.Validate() ]`)

### ObjectId

```graphql
type Post {
  # You send it as a string to GraphQL and it automatically transforms it.
  ownerId: ObjectId!
}
```

Your GraphQL scalar should take care of this already, but it's also good if we could re-use this logic in validation:

```ts
import { ObjectId } from "@bluelibs/ejson";

@Schema()
class Post {
  @Is(an.objectId())
  ownerId: ObjectId;
}
```

### Unique Database Field

If we want to easily prevent users from signing up with the same "phone number" let's say:

```ts
class UserRegistrationInput {
  @Is(
    a.string().required().uniqueField({
      collection: UsersCollection,
      // Because we're in MongoDB's realm you can also use '.' for your fields for nested value (profile.phoneNumber)
      field: "phoneNumber",
    })
  )
  phoneNumber: string;
}
```

## Routers

Typically an application has an api and a frontend, we we are offering this built-in inside the bundle configuration.

```ts
new XBundle({
  rootUrl: "http://localhost:4000/",
  appUrl: "http://localhost:3000/",
});
```

```ts
import { APP_ROUTER, ROOT_ROUTER } from "@bluelibs/x-bundle";

const appRouter = container.get(APP_ROUTER);
const rootRouter = container.get(ROOT_ROUTER);

// Used oftenly when sending emails:
appRouter.path("/new-features"); // http://localhost:3000/new-features
rootRouter.path("/webhooks/stripe"); // http://localhost:4000/webhooks/stripe
```

Create your own extra routers with ease. This we found very handy when dealing with paths and routes in a scalable fashion.

```ts
import { Service, Inject } from "@bluelibs/core";

@Service()
class MyRouter extends Router {
  constructor(
    // Set as a kernel parameter
    @Inject("%CUSTOM_URL%")
    baseUrl
  ) {
    super(baseUrl);
  }
}
```

## CRUD

If we want to go fast, we sometimes need to be "less specific" and go around some of GraphQL principles. You can completely opt-out of this and have type-safety everywhere no problem, we're just saying that sometimes, in the beginning, as you prototype, you might not care too much about this.

These types are already provided by `XBundle` and you can use them:

```graphql
## This is for finding data and counting elements
input QueryInput {
  filters: EJSON
  options: QueryOptionsInput
}

input QueryOptionsInput {
  sort: EJSON
  limit: Int
  skip: Int
}

## For updating documents
input DocumentUpdateInput {
  _id: ObjectId!
  dataSet: EJSON!
}

## The input for removing documents
input DocumentDeleteInput {
  _id: ObjectId!
}
```

This means that you can easily do a CRUD like:

```graphql
type Query {
  adminPostsFindOne(query: QueryInput): Post
  adminPostsFind(query: QueryInput): [Post]!
  adminPostsCount(filters: EJSON): Int!
}

type Mutation {
  adminPostsInsertOne(document: PostNewInput!): Post
  adminPostsUpdateOne(_id: ObjectId!, document: PostUpdateInput!): Post!
  adminPostsDeleteOne(_id: ObjectId!): Boolean
}
```

Below you have a complete CRUD that later you can easily adapt to have type-safety at GraphQL level. This is very useful when you are generating lots of them.

```ts
import * as X from "@bluelibs/x-bundle";

export default {
  Query: [
    [],
    {
      adminPostsFindOne: [X.ToNovaOne(PostsCollection)],
      adminPostsFind: [X.ToNova(PostsCollection)],
      adminPostsCount: [X.ToCollectionCount(PostsCollection)],
    },
  ],
  Mutation: [
    [
      // You could add here X.CheckLoggedIn() which applies to all.
    ],
    {
      adminPostsInsertOne: [
        X.ToModel(PostNewInput, { field: "document" }),
        X.ToValidate({ field: "document" }),
        X.ToDocumentInsert(PostsCollection),
        X.ToNovaByID(PostsCollection),
      ],
      adminPostsUpdateOne: [
        X.ToModel(PostUpdateInput, { field: "document" }),
        X.ToValidate({ field: "document" }),
        X.CheckDocumentExists(PostsCollection),
        X.ToDocumentUpdateByID(WorldsCollection, null, (args) => ({
          $set: args.document,
        })),
        X.ToNovaByID(PostsCollection),
      ],
      adminPostsDeleteOne: [
        X.CheckDocumentExists(PostsCollection),
        X.ToDocumentDeleteByID(PostsCollection),
        X.ToNovaByID(PostsCollection),
      ],
    },
  ],
};
```

Now you have exposed a CRUD that the [Client Side Collections](package-x-ui) can communicate with the API giving you the capability of working with the database on the client.

As long as you respect the GraphQL Schema feel free to create and juggle with the executors how you wish, most of the times as your application evolves they will delegate to services after input validation has passed.

## Live Data

Imagine that the data you see in your web page is the actual data in the database. Changes happen live before your eyes, no more need to refresh the dataset, realtime is here.

Sometimes real-time datasets are not worth it, imagine a table full of data, you wouldn't want inserts in the database change things such as pagination or etc, but you might need it for live messages or viewing a current User report or following the stock market.

With our tooling, you can subscribe and receive notifications when things change in the MongoDB database. This is done fully decoupled from `MongoDB` via a separate communication channel. By default we support `Redis` but any pubsub system can be used, it's extremely easy to integrate.

:::note
You do not need a Redis-server for your localhost environment. We automatically fall-back to our in-memory messenger. That can work if you have a single deployment server,bBut once you have more instances serving the app to your clients to have reliable live-data you should add Redis in your network, or any other messenger.
:::

```ts title="kernel.ts"
// Make sure it's activated
new XBundle({
  live: {
    // This will log what changes are sent, received, and what gets updated
    debug: true,
  },
});
```

### Concept

Let's imagine a client subscription as a stream of events that tell the client how to update their store of data.

When subscribing for the first time, I will get `added` events with all the documents in my query. When things change I can receive events such as `changed` or `removed` and we update our client-storage accordingly.

```ts
[
  // Real-life example on how it happens
  { event: "added", document: { _id: 1, title: "Name" } },
  { event: "added", document: { _id: 2, title: "Name 2" } },
  { event: "updated", document: { _id: 1, title: "New Name" } },
  { event: "removed", document: { _id: 1 } },
];
```

The job of the client (whatever it may be iOS, Web, React Native, etc) is to update its own store then notify the client to ensure the UI gets rerendered with fresh data.

Behind the scenes what happens is that when a change happens in the system through [MongoBundle](package-mongo) Collection updates, is sent out to the `messenger` and delivered to all instances listening for that change.

The system is very advanced as it can support fetching relational data through Nova and doing complex searches such as finding the last 5 invoices who have `status = paid` and sorted by `paidAt`. The live data is not limited to a document, but rather an actual mongodb query you would normally do filtering and sorting included.

### Data Flow

The client updates something in the database through a GraphQL mutation, this change is caught through [MongoBundle](package-mongo) Collection events and they are translated and submitted to specific channels in your network pubsub system.

At the same time, besides sending messages, your server also listens for messages, whenever a client subscribes to a reactive data set, the server opens the path to incoming events on special channels relevant to the subscription.

When a message is received, they translate these events through highly-performant `Reactive Event Processors` and send the change in the set to the client in a very secure fashion.

### Behaviors

Collections need to emit messages when a mutation (insert/update/remove) happens in the system. We do this by attaching a behavior to it.

```ts
import { XBehaviors } from "@bluelibs/x-bundle";

class PostsCollection extends Collection {
  behaviors: [
    XBehaviors.Live()
  ]
}
```

You can opt-out of live behavior by passing it inside the context:

```ts
const postsCollection = container.get(PostsCollection);

postsCollection.updateMany(
  {},
  {},
  {
    live: {
      disable: true,
    },
  }
);
```

### Subscriptions

Creating a subscription is like doing a Nova query. Keep in mind that reactivity is only triggered at the level of the collection.

```ts
const postsCollection = container.get(PostsCollection);

const handle = SubscriptionStore.createSubscription(
  postsCollection,
  // Nova QueryBody
  {
    $: {
      filters: {},
      options: {},
    },
    // Specify the fields needed
    title: 1,
  },
  {
    async onAdded(document) {
      // Do something
    },
    async onChanged(documentId, updateSet, oldDocument) {
      // Do something else
    },
    async onRemoved(documentId) {
      // Do something else
    },
  }
);

handle.onStop(() => {});
handle.stop();
```

:::warning
If you are using collection links, and data from those related documents change, you **will not** see any changes in your subscription. The solution we propose is to create additional subscriptions for nested relationships if you want to benefit of their live data. Subscriptions Data Graphs can affect performance drastically: cpu and memory usage. We recommend avoiding them and only use them when needed.
:::

### GraphQL

A sample implementation in GraphQL.

```graphql
type Subscription {
  users(body: EJSON): SubscriptionEvent
}
```

```ts
// Resolver
const resolvers = {
  Subscription: {
    users: {
      resolve: (payload) => payload,
      subscribe(_, args, { container }, ast) {
        const collection = container.get(collectionClass);
        const subscriptionStore = container.get(SubscriptionStore);

        // feel free to use `secureBody` from Nova to perform security checks to your body before creating a subscription for it

        subscriptionStore.createAsyncIterator(collection, args.body);
      },
    },
  },
};
```

You can additionally hook into the resolve() function and apply additional changes or data clearences before it sends the data to the client.

```ts
import { GraphQLSubscriptionEvent } from "@bluelibs/x-bundle";

const subscription = {
  async resolve({ event, document }, args, { container }) {
    if (event === GraphQLSubscriptionEvent.ADDED) {
      // Attach information to document
      Object.assign(document, {
        // ...
      });
    }
    // You can also apply the same concepts for example when a certain relation is changing.

    return { event, document };
  },
  subscribe() {},
};
```

An example of how can we notify a client that something new was added to a certain view:

```ts
const subscription = {
  resolve: (payload) => ({ event: payload.event }),
  subscribe(_, args, { db }) {
    const collection = container.get(collectionClass);
    const subscriptionStore = container.get(SubscriptionStore);

    return subscriptionStore.createAsyncIterator(collection, {
      $: {
        filters: args.filters,
        options: {
          // Note that we only subscribe by _id we only care about new things that are added
          fields: { _id: 1 },
        },
      },
      // Other fields
    });
  },
};
```

:::warning
Subscriptions without [secureBody()](package-nova#secure-the-body) from [Nova](package-nova) subscriptions are inherently insecure. Run `secureBody()` to perform at least an intersection as you construct your subscription.
:::

You also have the ability to have a counter subscription:

```graphql
type Subscription {
  usersCount(body: EJSON): SubscriptionCountEvent
}
```

```ts
function subscribe(_, args, { db }) {
  const collection = container.get(collectionClass);
  const subscriptionStore = container.get(SubscriptionStore);

  return subscriptionStore.createAsyncIteratorForCount(
    collection,
    args.filters
  );
}
```

### Executors

To allow you to write less code, you can use the built-in executors:

```ts
import * as X from "@bluelibs/x-bundle";

export default {
  Subscription: {
    // Default resolver works for argument signature: { body: EJSON }
    usersSubscription: {
      resolve: (payload) => payload,
      subscribe: [X.ToSubscription(collectionClass)],
    },
    // Default resolver works for argument signature: { body: EJSON }
    usersSubscription: {
      resolve: (payload) => payload,
      subscribe: [
        X.ToSubscription(collectionClass, (_, args) => {
          // Here you can use intersectBody from @bluelibs/nova to perform smart operations
          // return intersectBody(args.body, allowedBody)
          return args.body;
        }),
      ],
    },
    // Default resolver works for argument signature: { filters: EJSON }
    usersSubscriptionsCount: {
      resolve: (payload) => payload,
      subscribe: [X.ToSubscriptionCount(collectionClass)],
    },
  },
};
```

### Deployment & Customisation

When you deploy on more than one server, you need a way to communicate for live data. You have the built-in redis tool:

```ts
new XBundle({
  live: {
    // Keep redis in your network's infrastructure for fast speeds
    // More about options here: https://github.com/NodeRedis/node-redis#rediscreateclient
    redis: {
      host: "127.0.0.1",
      port: 6379,
    },
  },
});
```

If redis connection dies, once it gets reconnected all the "live queries" will be requeried from the database automatically.

While Redis is nice, we also allow you to use your own custom messenger, which implements the exported interface `IMessenger`.

```ts
import { Service } from "@bluelibs/core";
import { IMessenger, XBundle, MessageHandleType } from "@bluelibs/x-bundle";

@Service()
class AppMessenger implements IMessenger {
  // To implement the methods below.
  subscribe(channel: string, handler: MessageHandleType);
  unsubscribe(channel: string, handler: MessageHandleType);
  // Keep in mind data can be anything, you need to ensure serialisation/deserialisation yourself.
  publish(channels: string[], data);
}

new XBundle({
  live: {
    messengerClass: AppMessenger,
  },
});
```

### Scaling

When you subscribe for elements by `_id` or a list of ids. It's incredibly scalable because you listen to events on their dedicated channel, example: `posts:{postId}`, so you don't have to worry at all about that. Redis server scales and it can handle 300,000 messages/second, good luck reaching that limit (and when you reach it, redis is easily horizontally scalable)

The scaling problem happens on lists, for example, you want to listen to a list of `Message` objects in a certain `Thread`. When we are subscribing to lists (aka live collection views), we are listening to events on the collection channel, example: `posts`. All updates, inserts, removes which happen in `posts`

While this can work for a while, it breaks when you have chatty collections when a lot of mutations happen on it. Luckily we have a solution for this by introducing `custom channels`.

Let's take the example of comments on a post:

```ts
const postCommentsCollection = container.get(PostCommentsCollection);

postCommentsCollection.insertOne(comment, {
  context: {
    live: {
      // Note: this will also push to `comments` and `comments::${commentId}`
      channels: [`posts::${postId}::comments`],
    },
  },
});

// And for your GQL resolver, or whatever, pass the next argument the options:
const resolvers = {
  postCommentsSubscription: {
    subscribe: X.ToSubscription(
      CommentsCollection,
      // Resolve body
      null,
      (_, args) => {
        return {
          channels: [`posts::${args.postId}::comments`]
        }
      }
    );
  },
};
```

:::warning
Be careful with live-data, use it sparingly and only when you need it, this will ensure that your app is scalable for a long time. Keep in mind that the most dangerous subscriptions are the ones that listen to the main collection channels. You shouldn't be worried if you have 10 mutations per second, which happens only after a certain scale either way.
:::

## Meta

### Summary

The X-Framework Server is a powerhouse of insightful ways to use Foundation enhancing Developer Experience for the rudimentary things. It is complemented perfectly our [React Client](package-x-ui) which allows you to use client-side collections, authentication through guardian, live data support, and so much more.

### Boilerplates

The X-CLI (`@bluelibs/x`) is the boilerplate generator, meaning that you get a boilerplate by following [Get Started](x-framework-introduction#get-started) from [Introduction](x-framework-introduction).

In, short:

```bash
# Ensure you have Node, MongoDB
npm i -g @bluelibs/x
x
# pick x:project
# follow instructions
```

### Challenges

- What executor would I use if I want to apply 2 different security rules depending on wether the user is `Admin` or `Manager` role? (1p)
- Make use of [XPasswordBundle](package-x-password-bundle) to enhance your server with authentication and create a user (3p)
- Can I use Apache Kafka or any other pubsub system for my live data? (1p)
- What function should we use when we receive a Nova body from the client to secure it? (2p)
