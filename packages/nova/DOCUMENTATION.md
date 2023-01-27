## Purpose

Nova is the fetching layer on top of MongoDB Node Driver, which allows SQL-comparable speeds for retrieving relational data. Explore our analysis of [Nova vs the relational world](https://docs.google.com/spreadsheets/d/1F0qRFMoOy34W1dQ2RpvmmPzIesYsBo-TZ3cBTyhX6Do/edit#gid=2089988421) to see how it compares to SQL and other popular MongoDB solutions such as `mongoose`.

GraphQL is treated as a first-class citizen, by offering ability to transform the GraphQL query into a Nova query. **You do not have to use GraphQL to use this library**.

The incredible speed boost is possible thanks to the technology called Hypernova, you can read more in the section with the same name below.

- It makes it a joy to use MongoDB as a relational database
- Support for relational filtering & sorting
- [Speeds surpassing SQL in various scenarios](https://docs.google.com/spreadsheets/d/1F0qRFMoOy34W1dQ2RpvmmPzIesYsBo-TZ3cBTyhX6Do/edit#gid=2089988421)
- [Lower bandwidth used than SQL for joined documents](https://docs.google.com/spreadsheets/d/1F0qRFMoOy34W1dQ2RpvmmPzIesYsBo-TZ3cBTyhX6Do/edit#gid=2089988421)
- Works with the default MongoDB Node Drivers
- Super light-weight integration for GraphQL

## Install

```
npm i -S mongodb @bluelibs/nova
```

## Linking Collections

Collections are linked through `addLinks(collection, linkingInformation)`, collections are instances of `mongodb.Collection`.

Let us create a One-to-One relationship in which we have `Patients` and `MedicalProfiles` in two distinct collections.

```typescript
import { addLinks } from "@bluelibs/nova";

// Patients, MedicalProfiles are just two `mongodb.Collection`s

addLinks(Patients, {
  // This is the name of the link
  medicalProfile: {
    collection: () => MedicalProfiles,
    // Where to read the id, that exists in MedicalProfiles
    field: "medicalProfileId",

    // Whether it's an array of ids, or just a single id, in our case
    // @default = false
    many: false,

    // We would make this true if we didn't expect another Patient with
    // the same MedicalProfile ID; see below
    // @default = false
    unique: false,
  },
});
```

This would allow us to run the following query:

```typescript
import { query } from "@bluelibs/nova";

const results = await query(Patients, {
  aField: 1,
  someOtherField: 1,
  someNestedField: {
    someValue: 1,
  }
  // This is the actual collection link
  medicalProfile: {
    // This is a field that belongs inside the MedicalProfile collection document
    bloodPresure: 1,
  }
}).fetch();

// You can also run .fetchOne() instead of .fetch() if you expect a single result
```

When we talk about inversed links, we mean that we want to query `MedicalProfiles` and go to `Patients`, to do that we have to setup an inversed link:

```typescript
addLinks(MedicalProfiles, {
  patient: {
    collection: () => Patients,

    // The actual link name, that was configured from Patients
    inversedBy: "medicalProfile",
  },
});
```

After we do this, we can easily do:

```typescript
import { query } from "@bluelibs/nova";

const medicalProfile = await query(MedicalProfiles, {
  patient: {
    name: 1,
  },
}).fetchOne();
```

However, this time you will notice that `medicalProfile.patient` is actually an array. And that's because it doesn't know it's unique, because this strategy can also be applied to having `One-to-One` and `One-to-Many`. Imagine that if you want to link `Comments` with `Post` via a `postId` stored in the `Comments` collection, you would do the same type of linking, it's a link of type `one`.

In our case, the solution is to add `unique: true` when defining the `medicalProfile` link inside `Patients` collection:

```typescript
addLinks(Patients, {
  medicalProfile: {
    collection: () => MedicalProfiles,
    field: "medicalProfileId",
    // This tells us that this relationship is definitely One-to-One.
    unique: true,
  },
});
```

### Relationship Types

Let us explore all types of relationships that can exist:

#### A One-to-One B

```ts
addLinks(A, {
  b: {
    collection: () => B,
    field: "bId",
    unique: true,
  },
});
addLinks(B, {
  a: {
    collection: () => A,
    inversedBy: "b",
  },
});
```

#### A One-to-Many B

```ts
addLinks(A, {
  bs: {
    collection: () => B,
    inversedBy: "a",
  },
});
addLinks(B, {
  a: {
    collection: () => A,
    field: "aId",
  },
});
```

#### A Many-to-Many B

```ts
addLinks(A, {
  bs: {
    collection: () => B,
    field: "bIds",
    many: true,
  },
});
addLinks(B, {
  a: {
    collection: () => A,
    inversedBy: "bs",
  },
});
```

### Linking Shortcuts

```typescript
import { oneToOne, oneToMany, manyToOne, manyToMany } from "@bluelibs/nova";

// The link is stored in the first mentioned collection
manyToOne(Comments, Post, {
  linkName: "post",
  inversedLinkName: "comments",
  // field will be `postId`
});

oneToOne(Users, GameProfile, {
  linkName: "gameProfile",
  inversedLinkName: "user",
  // field will be `gameProfileId`
});

oneToMany(Posts, PostWarnings, {
  linkName: "postWarnings",
  inversedLinkName: "post", // single
  // field will be `postWarningsIds`
});

manyToMany(Posts, Tags, {
  linkName: "tags",
  inversedLinkName: "posts",
  // field will be `tagsIds`
});
```

If you want custom configuration, use the `addLinks()` functions.

Notes:

- You can go as deeply as you want with your queries
- Field storage can be stored in a nested field. Specify `field: "profile.medicalProfileId"`
- Indexes are automatically set. If you want custom indexes use `index: false` when defining the direct link.

### Filtered Links

If you want to get the links and apply certain filters on it you could do it by specifying `filters` when defining the link:

```ts
addLinks(Companies, {
  employees: {
    collection: () => Users,
    inversedBy: "company",
    filters: {
      roles: { $in: ["EMPLOYEE"] },
    },
  },
  managers: {
    collection: () => Users,
    inversedBy: "company",
    filters: {
      roles: { $in: ["MANAGER"] },
    },
  },
});

addLinks(Users, {
  company: {
    collection: () => Companies,
    field: "companyId",
  },
});
```

Now when you query by employees, you are guaranteed you will get all users which have the filters you specified in your query (if any) AND the filters specified in the link.

The `filters` can also be a function that accepts currently set filters to it:

```ts
addLinks(Users, {
  // Don't get comments approved unless specified
  comments: {
    filters(options) {
      // the options.filters are the current filters by which this node is requested with
      // Sample code: if you haven't added some default filters already, apply this one
      if (options.filters.isApproved === undefined) {
        return {
          isApproved: true,
        };
      } else {
        return {};
      }
    },
  },
});
```

### Aliasing

Sometimes you may find useful to fetch the same link but in different contexts, for example you want to get a Company with the last 3 invoices and with overdue invoices without much hassle (see the next section for more information on `query()` and the `$` field):

```typescript
manyToOne(Invoices, Company, {
  linkName: "company",
  inversedLinkName: "invoices"
});

query(Company, {
  lastInvoices: {
    $alias: "invoices",
    $: {
      options: {
        sort: { createdAt: -1 },
        limit: 3
      }
    },
    number: 1,
  },
  overdueInvoices: {
    $alias: "invoices",
    $: {
      filters: {
        isPaid: false,
        paymentDue: { $lt: Date.now() }
      }
    }
    number: 1,
  }
});
```

We currently don't offer a built-in way to handle these aliases, like an `addAlias()` function, we don't do that because in this realm it will depend a lot of your business logic and query-ing strategies. You could compose them something like this:

```js
const overdueInvoicesAlias = {
  $alias: "invoices",
  $: { filters: { '...' } }
};

query(Company, {
  overdueInvoices: {
    ...overdueInvoicesAlias,
    number: 1,
  }
})
```

## Querying

We showed a little bit of how we can query stuff, but we need to dive a little bit deeper, so let's explore together how we can filter, sort, and paginate our query.

We introduce a special `$` field that isn't really a field, it's more like a meta-ish way to describe the current node. Let's explore the `filters` and `options` parameters of this special "field".

```typescript
import { query, oneToMany } from "@bluelibs/nova";

manyToOne(Comments, Posts, {
  linkName: "post",
  inversedLinkName: "comments",
});

query(Posts, {
  $: {
    // MongoDB Filters
    filters: {
      isPublished: true,
    },

    // MongoDB Options
    options: {
      sort: {
        createdAt: -1,
      },
      limit: 100,
      skip: 0,
    },
  },
  title: 1,
  comments: {
    $: {
      // You can also use it for your nested collections
      // This will only apply to the comments for the post
      filters: {
        isApproved: true,
      },
      options: {
        sort: {
          createdAt: -1,
        },
      },
    },
    text: 1,
  },
});
```

## Relational Filtering and Sorting

### Filtering

While working with MongoDB, another pain-point was what we call `relational filtering`, which simply means, I want to get all employees that belong in a company that is verified. Then what if I want to paginate them?

All of these problems are currently solved, and we belive the API is far superior than SQL in terms of clarity.

```typescript
import { oneToMany, query, lookup } from "@bluelibs/nova";

manyToOne(Employees, Companies, {
  linkName: "company",
  inversedLinkName: "employees",
});

query(Employees, {
  $: {
    // This allows us to hook into the pipeline and filter the employee result
    pipeline: [
      // This performs the link from Employees to "company"
      // You don't have to worry about how it's linked, you will use your natural language
      lookup(Employees, "company"),
      {
        $match: {
          "company.verified": true,
        },
      },
    ],
    options: {
      limit: 10,
      skip: 10,
    },
  },
  firstName: 1,
});
```

What did just happen?

- `pipeline: []` option allows us to hook into the aggregation pipeline used for fetching the employees
- `lookup()` function creates a smart \$lookup aggregator and projects the result as the link name

Why not take it a little bit further? What if we want all the employees from companies that have at least 5 departments? This implies that we need to go deeper into the pipeline:

```typescript
const result = await query(Employees, {
  $: {
    pipeline: [
      lookup(Employees, "company", {
        // Here's the nice part!
        pipeline: [
          lookup(Companies, "departments"),
          // I'm expanding the "company" to contain a "departmentsCount" field
          {
            $addFields: {
              departmentsCount: { $size: "$departments" },
            },
          },
        ],
      }),
      // I'm performing this match at user because this is where we need to decide whether the user will exist or not in the result set
      {
        $match: {
          "company.departmentsCount": {
            $gte: 2,
          },
        },
      },
    ],
  },
  _id: 1,
  companyId: 1,
}).fetch();
```

Pipeline will work in the same manner on nested collections:

```typescript
query(Companies, {
  employees: {
    $: {
      pipeline: [
        // Some logic to include or exclude the employee
      ],
    },
  },
});
```

### Sorting

A common scenario is to sort by other's field value. For example I'm looking at employees but I'm sorting the list by Company's name. Where `company` is the link from `employees` collection.

```ts
// We are looking for A's which have exactly 2 B's
const result = await query(Employees, {
  $: {
    pipeline: [
      lookup(Employees, "company"),
      {
        $sort: {
          "company.name": 1,
        },
      },
    ],
  },
  _id: 1,
  // other fields
}).fetch();
```

You can apply sorting even for computed values, as you've seen above, where we calculated the departments count.

## Dynamic Filters

What if for example, I want the nested collection filters/options to perform differently based on the parent? To do so, you transform \$ into a `function()` that passes the parent element.

```js
query(Users, {
  comments: {
    $(user) {
      return {
        filters: {},
        options: {},
        pipeline: {},
      };
    },
    author: {
      name: 1,
    },
  },
});
```

This comes with a performance cost. Because the filters depend on the parent, we will have to query the database to get the comments once for every `user`.

## Reducers

Reducers are a way to expand the request query and compute the values. Imagine them as virtual, on-demand computed query fields:

```typescript
import { addReducers } from "@bluelibs/nova";

addReducers(Users, {
  fullName: {
    dependency: {
      // Here we define what it needs to resolve
      // Yes, you can specify here links, fields, nested fields, and other reducers as well
      profile: {
        firstName: 1,
        lastName: 1,
      },
    },
    // Reducers can also work with parameters
    async reduce(obj, params) {
      let fullName = `${obj.profile.firstName} ${obj.profile.lastName}`;
      if (params.withPrefix) {
        fullName = `Mr ${fullName}`;
      }

      return fullName;
    },
  },
});
```

```typescript
query(Users, {
  fullName: 1,
});

query(Users, {
  fullName: {
    // Or with params
    $: {
      withPrefix: true,
    },
  },
});
```

Reducers have the power to expand the pipeline, for example, if you want to get all the posts and their comments count in one request, you have 2 ways:

1. You create a reducer that performs a count for each
2. You create a reducer that extends the pipeline to give you a `commentsCount` field

```typescript
addReducers(Posts, {
  commentsCount: {
    dependency: { _id: 1 },
    pipeline: [
      lookup(Posts, "comments"),
      {
        $addFields: {
          commentsCount: { $size: "$comments" },
        },
      },
    ],
  },
});
```

### Context in Reducers

```ts
addReducers(Users, {
  fullName: {
    dependency: {},
    async reduce(obj, params) {
      const { context } = params;
      // Do something with context.language
    },
  },
});

// Let's pass the language as a context as the 3rd parameter to query
// Context will reach reducers
query(
  Users,
  {
    fullName: 1,
  },
  // The context
  {
    language: "en",
  }
);
```

Extend the `IQueryContext` interface to benefit of autocompletion:

```ts title="declarations.ts";
import "@bluelibs/nova";

declare module "@bluelibs/nova" {
  export interface IQueryContext {
    language: string;
  }
}
```

You can also specify `$context` inside the query:

```ts
query(Users, {
  $context: {
    language: "en",
  },
  fullName: 1,
});
```

Notes:

- Context is passed to all reducers below the current one.
- While `$context` can be nested into deeper collections, please note that the context on top will have priority and will override the contexts below and merge with them. This is important because we want the 'rule of law' to be the top context.
- Do not specify nested fields inside reducer's dependency, use instead: `profile.name: 1` => `profile: { name: 1 }`
- Reducers can use other links and other reducers naturally, it ensures there is no circular dependency and optimizes compute to reduce the number of 'reduce' function calls.
- Be careful when extending the pipeline and what fields you use.

## Secure the Body

Sometimes you might get the body of a request from the client. You want to ensure the client doesn't ask for extra fields and that it's at least decent in its request. This is how we can do this once we get that body:

```ts
import { secureBody } from "@bluelibs/nova";

const safeBody = secureBody(
  {
    title: 1,
  },
  {
    // Intersection is what they have in common
    // This is the best way to secure your graph. By stating explicitly what you allow query-ing

    // Does not throw exception, just eliminates extra and bogus fields from your body
    intersect: {},

    // This is useful to avoid a nested attack
    // Depth applies to deeply nested fields, not only collection links
    maxDepth: 10,

    // Automatically enforces a maximum number of results
    maxLimit: 10,

    // Simply removes from the graph what fields it won't allow
    // Can work with deep strings like 'comments.author'
    deny: [], // String[]

    // This will get merged with the main body before applying all security restrictions
    // It is called side, because usually it's designed to blend "$" objects into an extracted query from GQL
    sideBody: {},
  }
);

// Or the handy version
const result = query.securely(config, collection, body, context).fetch();
```

## GraphQL Integration

The integration removes the necessity of writing custom resolvers to fetch related data. Everything is computed efficiently.

```typescript
import { query } from "@bluelibs/nova";

// Define your query resolvers
const Query = {
  users(_, args, context, info) {
    return (
      query
        // Please note that this is a MongoDB collection instance
        .graphql(myMongoDBCollection, info, {
          // Manipulate the transformed body
          // Here, you would be able to remove certain fields, or manipulate the Nova Query body
          // This happens before creating the nodes, so it gives you a chance to do whatever you wish
          embody(body, getArguments) {
            body.$ = {
              // Set some options here
            };

            // You can get the arguments of any path
            const commentsArgument = getArguments("comments");

            // Comments author's arguments
            const authorArguments = getArguments("comments.author");
          },

          // The other options from Secure your Body apply here
        })
        .fetch()
    );
  },
};
```

If you do however want your resolving to happen in GraphQL Resolvers not inside a reducer, we introduce a new concept, called `Expanders`.

Let's say you have a resolver at `User` level called `fullName` that uses `firstName` and `lastName`:

```js
import { addExpanders } from "@bluelibs/nova";

addExpanders(Users, {
  // Full name will not appear in the result set
  fullName: {
    profile: {
      firstName: 1,
      lastName: 1,
    },
  },
});

query(Users, {
  fullName: 1,
}).fetchOne();
```

Expanders can self-reference themselves:

```ts
addExpanders(Users, {
  _id: {
    _id: 1,
    // some other field you want to request when _id: 1 is requested
  },
});
```

## Limitations

#### Limit/Skip in the nested collections

Let's take this post for example, we want to find all posts, then we want the latest 5 comments from each.

Currently, we store `postId` inside the comments collection:

```js
query(Posts, {
  comments: {
    $: {
      options: {
        sort: { createdAt: -1 },
        limit: 5
      }
      author: {
        name: 1,
      }
    }
    name: 1,
  }
}
```

Hypernova is not able to retrieve all comments for all posts in one-go (because of limit/skip). Therefore it has to do it iteratively for each found post. However, hypernova works afterwards when we need to fetch the authors of comments. It will fetch all authors in one-go, and properly assemble it.

#### Dynamic Filterings

When you are using a dynamic filter for your nested collections:

```js
query(Posts, {
  comments: {
    $(post) {
      return {
        filters: {
          // Some filters
        }
      }
    }
  }
}
```

Hypernova will be disabled, and it will run the query for fetching the comments for each individual Post. Because most likely your filters and options depend on it.

#### Top-level fields for linking information

We allow storing link storages within nested objects such as:

```typescript
{
  profile: {
    paymentProfileId: []; // <- Like this
  }
}
```

```typescript
// WORKS
addLinks(Users, {
  collection: () => PaymentProfiles,
  field: "profile.paymentProfileId",
});
```

However, we currently can't work with fields in arrays of objects, or have array of objects connect to certain collections:

```js
// NOT POSSIBLE to link with a schema as such:
{
  users: [
    {userId: 'xxx', roles: 'ADMIN'},
    ...
  ]
}
```

## Hypernova

This is the crown jewel of Nova. It has been engineered for absolute performance. We had to name this whole process somehow, and we had to give it a bombastic name, due to its similarity with an explosion of data.

To understand what we're talking about let's take this example of a query:

```js
query(Posts, {
  categories: {
    name: 1,
  },
  author: {
    name: 1,
  },
  comments: {
    $options: { limit: 10 },
    author: {
      name: 1,
    },
  },
});
```

#### Counting Queries

In a normal scenario, to retrieve this data graph we need to:

1. Fetch the posts
2. length(posts) x Fetch categories for each post
3. length(posts) x Fetch author for each post
4. length(posts) x Fetch comments for each post
5. length(posts) _ length(comments) _ Fetch author for each comment

Assuming we have:

- 10 posts
- 2 categories per post
- 1 author per post
- 10 comments per post
- 1 author per comment

We would have blasted the database with:

- Posts: 1
- Categories: 10
- Post authors: 10
- Post comments: 10
- Post comments authors: 10\*10

This means `131` database requests.

Ok, you can cache some stuff, maybe some authors collide, but in order to write a performant implementation
you would have to write a bunch of non-reusable code.

But this is just a simple query, imagine something deeper nested. For Nova, it's a breeze.

**How many requests we do via Hypernova?**

- 1 for Posts
- 1 for all authors inside Posts
- 1 for all categories inside Posts
- 1 for all comments inside Posts
- 1 for all authors inside all comments

The number of database requests is predictable, because it represents the number of collection nodes inside the graph.
(If you use reducers that make use of links, take those into consideration as well)

It does this by aggregating filters at each level, fetching the data, and then it reassembles data to their
proper objects.

Not only does it make **5 requests** instead of 131, but it also smartly re-uses categories and authors at each collection node,
meaning you will have much less bandwidth consumed.

This makes it more efficient in terms of bandwidth than SQL or other relational databases.

Example:

```js
{
  posts: {
    categories: {
      name: 1;
    }
  }
}
```

Let's assume we have 100 posts, and the total number of categories is 4. Hypernova does 2 requests to the database,
and fetches 100 posts and 4 categories. If you would have used `JOIN` functionality in SQL, you would have received
the full category names for each post.

## Geographical Queries

If you would try to pass any of the following filters to a field, in the standard way (`$geoNear, $near, and $nearSphere`), it will fail saying: `$geoNear, $near, and $nearSphere are not allowed in this context`. The reason this happens is because our filters get transformed into a `$match` inside pipeline, and these ones aren't allowed.

The solution is to extend the pipeline as such:

```ts
const result = await query(Addresses, {
  $: {
    pipeline: [
      {
        $geoNear: {
          includeLocs: "loc",
          distanceField: "distance",
          near: { type: "Point", coordinates: [-73.99279, 40.719296] },
          maxDistance: 2,
        },
      },
    ],
  },
  name: 1,
}).toArray();
```

If you are using it in a GraphQL request:

```ts
const Query = {
  nearAddresses(_, args, context, info) {
    return query
      .graphql(Addresses, info, {
        sideBody: {
          $: {
            pipeline: [
              {
                $geoNear: {
                  // here it goes
                },
              },
            ],
          },
        },
      })
      .fetch();
  },
};
```

## Transactions

When you're working with transactions, you would like to `query` by passing a `session`:

```ts
query(
  usersCollection,
  {
    name: 1,
  },
  {
    // This is the MongoDB Client (Transaction) Session
    session,
  }
);
```

## High Performance Queries

Deeper queries are run in parallel, so make sure you have a connection `poolSize` of at least 10. This can be configured when creating your `MongoClient`. An even larger `poolSize` might increase performance, but it can also decrease it.

If you have a lot of nested fields, you also have the `$all: true` option at your disposal: sending out a large projection to MongoDB can sometimes make it slower than getting all the data. If you specify any collection fields and `$all: true`, all fields will be fetched, but your result will still be projected in the final result of the query.

We can also benefit from extremely rapid BSON decoding through JIT compilers as long as we know not only the fields, but their type too. This is done with the help of [@deepkit/bson](https://github.com/deepkit/deepkit-framework/tree/master/packages/bson) and [@deepkit/type](https://deepkit.io/documentation/type).

```ts
import { t, query } from "@bluelibs/nova"; // t is from "deepkit/type" package

const postSchema = t.schema({
  text: t.string,
  createdAt: t.date,
});

const commentsSchema = t.schema({
  text: t.string,
});

// We do this by adding the special "$schema" field at the collection node we want fast procesing
query(Posts, {
  $schema: postSchema,
  text: 1,
  createdAt: 1,
  comments: {
    $schema: commentsSchema,
  },
});
```

We recommend using the `addSchema` directly to the collections itself, removing the necessity of having to specify `$schema`:

```ts
import { t, addSchema } from "@bluelibs/nova"; // t is from "deepkit/type" package

addSchema(
  Posts,
  t.schema({
    text: t.string,
    createdAt: t.date,
    userId: t.mongoId,
    tagsIds: t.array(t.mongoId),
    // these are just the fields, no reducers nor collections should be defined here
  })
);

// High Performance Mode is now activated on all queries
query(Posts, {
  text: 1,
});
```

:::note
Reducers do not need to be added in the schema, as they are computed and added in the `post-processing` phase after the result has been retrieved. Be careful, if you add another field to the request, it must be in the schema, otherwise it won't show up.
:::

## Meta

### Summary

If you want to use MongoDB, Nova is the most advanced and fastest relational data fetcher in the Node ecosystem at the moment. Even if you do not use the whole `BlueLibs` ecosystem it's still a must for you.

### Boilerplates

- Create a free [MongoDB Atlas](https://www.mongodb.com/atlas/database) cluster so you can play with it.
- [Nova](https://stackblitz.com/edit/node-3ghtwy?file=README.md)

### Challenges

- Try to replicate a social network model with Posts, Comments, Users, Tags, PostCategories, Comment Reactions, Friendships. (4p)
