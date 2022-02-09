Collections can be regarded as an interface to your remote database via `GraphQL` as long as the remote queries and mutations respect a specific interface described in [X-Framework Server Core](/docs/package-x-bundle). You can generate compatible CRUD interfaces via `x` command line.

## Definition

```ts
import { Collection } from "@bluelibs/x-ui-collections-bundle";
import { Post } from "./Post.model";

export class Post {
  _id: any;
  title: string;
  isApproved: boolean;
}

export class PostsCollection extends Collection<Post> {
  getName() {
    // This is the endpoint name of the crud
    // Queries: PostsFind, PostsFindOne, PostsCount
    // Mutations: PostsInsertOne, PostsUpdateOne, PostsDeleteOne
    return "Posts";
  }

  // (optional)
  // By default it relies on EJSON (the flexy-plus hackish solution)
  // Blueprint will generate you type-safe solutions, and this is where you can customise the inputs
  getInputs() {
    return {
      insert: "PostInsertInput!",
      update: "PostUpdateInput!",
    };
  }
}
```

## Queries

Below, we'll have a simple example how to use the posts collection to find data.

```tsx
import { use } from "@bluelibs/x-ui-react-bundle";

function Component() {
  const postsCollection = use(PostsCollection);

  const [posts, setPosts] = useState([]);

  useEffect(() => {
    postsCollection
      .find(
        {},
        {
          // We specify which fields to use
          _id: 1,
          title: 1,
        }
      )
      .then((posts) => setPosts(posts));
  });

  // Render them somehow
}
```

Queries support both MongoDB filters and options:

```ts
postsCollection.find(
  {
    filters: {
      isApproved: true,
    },
    options: {
      sort: {
        createdAt: -1,
      },
    },
  },
  {
    _id: 1,
    title: 1,
  }
);
// The request can span-out on many lines, sometimes it's good to define them outside a component as QueryBodyType<T>
```

We also support relational data, if relations are defined with `Nova` in the backend:

```ts
postsCollection.find(
  {},
  {
    _id: 1,
    title: 1,
    author: {
      // Related collection
      name: 1,
    },
  }
);
```

We also support filtering the subset of relations:

```ts
// This sideBody will get merged on the backend, and is sent via options field.
const sideBody = {
  comments: {
    // This will only fetch the last 5 comments
    $: {
      options: {
        sort: { createdAt: -1 },
        limit: 5,
      },
    },
  },
};

postsCollection.find(
  {
    sideBody,
  },
  {
    _id: 1,
    title: 1,
    comments: {
      name: 1,
    },
  }
);
```

Relational sorting means that you're sorting your current set, by a relation's field. For example you're listing all employees, and you want them sorted by company's name:

```ts
employeesCollection.find(
  {
    options: {
      sort: {
        "company.name": 1,
      },
    },
  },
  {
    name: 1,
    company: {
      name: 1,
    },
  }
);
```

You can also find a single document with filters or by \_id:

```ts
let post;
post = postsCollection.findOne({ _id: postId }, { title: 1 });
// Equivallence
post = postsCollection.findOneById(postId, { title: 1 });
```

Counting documents is also easy:

```ts
postsCollection.count(filters).then((count) => {});
```

## Transformers & Serializers

This will transform the fetched result however you prefer, you can either instantiate a class with it using something like `class-transformers` package, or just modify certain fields. Serializers do the opposite, when you insert or update it transforms the data to go through GraphQL

What we normally recommend is do this for `_id` which are `ObjectId` and to transform numbers to `Date` for fields which are dates. Note it will only perform transformation if the response is not `undefined`.

```ts
import { ObjectId } from "@bluelibs/ejson";

class PostsCollection extends Collection<Post> {
  getTransformMap() {
    return {
      _id: (v) => new ObjectId(v),
      tagIds: (v) => v.map((v) => new ObjectId()),
      createdAt: (v) => new Date(v),
    };
  }

  // This is designed to work with custom inputs only
  getSerializeMap() {
    return {
      _id: (v) => v.toString(),
      createdAt: (v: Date) => v.getTime(),
      tagIds: (v) => v.map((v) => new ObjectId()),
    };
  }

  // The serialisation only occurs when custom inputs are specified
  // By default XBundle works with EJSON inputs, but you can also opt-in for custom inputs for clarity as your app grows
  getInputs() {
    return {
      insert: "PostInsertInput!",
      update: "PostUpdateInput!",
    };
  }
}
```

To be able to perform deep transformation when fetching elements with relations, we need to define the links:

```ts
class PostsCollection extends Collection<Post> {
  getLinks() {
    return [
      {
        name: "tags",
        collection: () => TagsCollection,
        many: true, // use false or omit for single relationships
        field: "tagIds", // if you are dealing with an inversed relationship
      },
    ];
  }
}
```

## Mutations

We have made the decision to not allow multi document updates or insertions due to security concerns. This is why we can only insert a single document, update document by \_id, and remove it also by \_id:

```ts
postsCollection
  .insertOne({
    title: 1,
    userId: "USER_ID",
  })
  .then(({ _id }) => {
    // Do something with the newly created _id
  });

postsCollection
  .updateOne(postId, {
    $set: {
      title: "New Title",
    },
  })
  .then(() => {
    // Do something after updating it
  });

postsCollection.deleteOne(postId).then(() => {
  // Do something after deleting it
});
```

## Extending Collections

If you want to add additional collection specific logic, it would be advisable to put it in the class itself. This would allow you to re-use the code as you need it.

```ts
class PostsCollection extends Collection<Post> {
  findAllApprovedPosts(): Promise<Post[]> {
    // You have access to apolloClient inside it
    return this.apolloClient
      .query({
        query: gql`...`,
        variables: {},
      })
      .then((response) => {
        return response.data.queryName;
      });
  }
}
```

## React Hooks

Integration with React is seamless and painless:

```tsx
import {
  useData,
  useLiveData,
  useDataOne,
  useLiveDataOne,
} from "@bluelibs/x-ui-collections-bundle";

function PostsList() {
  const {
    data: posts,
    isLoading,
    error,
    refetch,
  } = useData(
    PostsCollection,
    {
      // Query options
      filters: {},
      options: {},
    },
    {
      // The request body
      _id: 1,
      title: 1,
      comments: {
        text: 1,
      },
    }
  );
  // render the posts
}
```

If you are expecting a single post, we also have an easy find by \_id solution:

```tsx
const {
  data: post,
  isLoading,
  error,
  refetch,
} = useDataOne(PostsCollection, new ObjectId(props.id), body);
```

If you want to refetch the data simply call the `refetch()` function from your event listeners.

### Lists

We have created a [Smart](/docs/package-smart) that allows you to easily work with lists:

```ts title="PostListSmart.ts"
import { ListSmart } from "@bluelibs/x-ui-collections-bundle";
import React from "react";
import { Post, PostsCollection } from "../../collections";

const PostsListContext = React.createContext(null);
export class PostsListSmart extends ListSmart<Post> {
  collectionClass = PostsCollection;

  body = {
    // You have all the benefits of the Nova body we've seen in Collections
    // If you have a custom prop-based body you can pass it via config when doing `newSmart()`
    _id: 1,
    title: 1,
    user: {
      name: 1,
    },
  };

  static getContext() {
    return PostsListContext;
  }
}
```

Now we can use it in our components:

```ts
function Component() {
  const [api, Provider] = newSmart(PostsList, {
    perPage: 5, // optional pagination
    filters: {}, // initial filters that can't be overriden
    sort: {
      createdAt: -1,
    },
  });
}
```

Now you can access `api.state` from within `Component` or via `api = useSmart(PostsList)` in deeply nested children:

```ts
// This is how the state looks like:
export type ListState<T = any> = {
  isLoading: boolean;
  isError: boolean;
  isCountLoading: boolean;
  isCountError: boolean;
  documents: T[];
  filters: MongoFilterQuery<T>;
  options: IQueryOptions<T>;
  currentPage: number;
  perPage: null | number;
  totalCount: number;
  errorMessage: string;
  countErrorMessage: string;
};
```

So you have acces to nice things now you will most likely play with:

```ts
api.setFilters({
  title: new RegExp("{value from a search field}", "i"),
});

api.updateSort({
  title: 1, // After let's say he clicks a table
});
```

## Live Data

If you want to use the smart live data, just swap `useData()` with `useLiveData()` and it will magically work, your data will be listening to changes.

```ts
import { useLiveData } from "@bluelibs/x-ui-collections-bundle";

const LiveDataPage = () => {
  const {
    data: posts,
    isLoading,
    error,
  } = useLiveData(
    PostsCollection,
    {
      filters: {},
      options: {},
    },
    requestBody
  );

  // or single element
  const {
    data: post,
    isLoading,
    error,
  } = useLiveDataOne(PostsCollection, new ObjectId(id), requestBody);
};
```

You can also hook into the events, via the 4th argument, options:

```ts
useLiveData(collectionClass, options, body, {
  onReady() {
    // Do something when all data has been initially loaded
  },
  onError(error: Error) {
    // Handle if subscription throws out an error
  },
  onChanged(document, changeSet, previousDocument) {
    // Do something when something about the subscription changes
  },
  onRemoved(document) {
    // Do something when document is removed
  },
  onAdded(document) {
    // Do something when document is added
  },
});
```

:::caution
When using live data and relations, it is by design to not have reactivity at nested levels. Instead you will have to create separate component that subscribes to that related object via `useLiveData()`.
:::

## Apollo React Integration

Apollo has a neat way of using `useQuery` and after doing a mutation for a specific type and returns the values, lists get re-rendered.

By default we offer a light-weight approach to data using `useData()`, but depending on your application you might need this caching functions in some places,
therefore we wanted to offer a seamless solution for this.

```ts
function Posts() {
  const collection = use(PostsCollection);
  const { data, loading, errors } = collection.useQuery(
    {
      _id: 1,
      title: 1,
      comments: {
        text: 1,
      },
    },
    {
      filters: { status: "approved" },
      options: {
        // limit, skip, sort
      },
    },
    {
      // This is an optional argument
      apollo: {
        // Pass here any additional Apollo query option you may need
        // https://www.apollographql.com/docs/react/data/queries/#usequery-api
        fetchPolicy: "network-only",
      },
    }
  );

  // data will be Post[] directly

  // Same concept applies to useQueryOne, useLazyQuery and useLazyQueryOne.
}
```

For working with single data relations please use `collection.useQueryOne()` having the exact same api, except `data` is going to be `Post` instead of `Post[]`.

When you perform a mutation, you can now trigger the cache, by doing so:

```ts
collection.updateOne(
  post._id,
  {
    title: "My New Title",
  },
  {
    refetchBody: {
      title: 1,
      // _id: 1 is auto-populated
    },

    apollo: {
      // This is an optional argument
      // Pass here any additional Apollo mutation option you may need
      // https://www.apollographql.com/docs/react/data/mutations/#usemutation-api
      refetchQueries: ["PostsFind"],
    },
  }
);

// Same concept applies to insertOne.
```

If you want to use `useMutation()` from Apollo for various reasons we expose the following helper functions:

```ts
const INSERT_MUTATION = collection.createInsertMutation(refetchBody);
const UPDATE_MUTATION = collection.createUpdateMutation(refetchBody);

// useMutation({ mutation: MUTATION })
```

:::note
Delete doesn't have a refetch body option because we assume you will treat this case separately. You can use Mutation options argument in `deleteOne()` to clear the cache of the deleted document manually.
:::

### Blueprint

Swapping to Apollo cached solution in the "View", "Edit" layers can be done as simple as:

```ts
const {
  data: document,
  loading: isLoading,
  error,
} = collection.useQueryOne(EntityViewer.getRequestBody(), {
  filters: {
    _id: new ObjectId(props.id),
  },
});
```

Inside table view, the data is fetched inside the ListSmart or AntTableSmart in `x-ui-admin`, which makes it hard to use `useQuery` hook to benefit of data caching.

To solve that, you can either call `tableSmart.load()` after you perform a mutation operation, or fetch the data via `useQuery()` and render your own table. Table smart reacts to page changes, filters, sorting, it smartly refetches every time data changes, doing this via `useQuery()` would mean implying a middleware Component which reads `filters, options` and figure out whether to recall `useQuery()` so you benefit of caching.
