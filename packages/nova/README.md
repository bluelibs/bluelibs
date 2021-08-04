<h1 align="center">BlueLibs NOVA</h1>

<p align="center">
  <a href="https://travis-ci.org/bluelibs/nova">
    <img src="https://api.travis-ci.org/bluelibs/nova.svg?branch=master" />
  </a>
  <a href="https://coveralls.io/github/bluelibs/nova?branch=master">
    <img src="https://coveralls.io/repos/github/bluelibs/nova/badge.svg?branch=master" />
  </a>
</p>

<br />
<br />

Nova is the fetching layer on top of MongoDB Node Driver, which allows SQL-comparable speeds for retrieving relational data.

GraphQL is treated as a first-class citizen, by offering ability to transform the GraphQL query into a Nova query. **You do not have to use GraphQL to use this library**.

The incredible speed boost is possible thanks to the technology called Hypernova, you can read more about it [inside the documentation](./docs/index.md#hypernova).

## What does it solve?

- It makes it a joy to use MongoDB as a relational database
- Support for relational filtering & sorting
- Speeds surpassing SQL in various scenarios
- Lower bandwidth used than SQL for joined documents
- Works with the default MongoDB Node Drivers
- Super light-weight integration for GraphQL

## [Documentation](./DOCUMENTATION.md)

[Click here to go to the documentation](./DOCUMENTATION.md)

## Sample

```js
import { query, manyToOne } from "@bluelibs/nova";

async function test() {
  const Post = await db.createCollection("Post");
  const Comments = await db.createCollection("Comments");

  manyToOne(Comments, Post, {
    // will automatically read from postId inside Comments
    linkName: "post",
    inversedLinkName: "comments",
  }); // also available manyToMany and manyToOne

  query(Post, {
    $: {
      filters: {
        isApproved: true
      }
    }
    title: 1,
    comments: {
      name: 1
    }
  })
}
```

## [GraphQL](./docs/index.md#graphql-integration)

```js
import { query } from "@bluelibs/nova";

const Query = {
  // Automatically fetches everything in the minimum amount of queries
  users(_, args, ctx, info) {
    return query.graphql(Posts, info).fetch();
  },
};
```

## Support

This package is part of [BlueLibs](https://www.bluelibs.com) family. If you enjoy this work please show your support by starring [the main package](https://github.com/bluelibs/bluelibs). If not, let us know what can we do to deserve it, [our feedback form is here](https://forms.gle/DTMg5Urgqey9QqLFA)
