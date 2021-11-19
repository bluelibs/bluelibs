This bundle is a set of tools allowing you to do beautiful frontends. Using the X-Framework.

## Install

You can easily create it by running `x`, choose `microservice`, and select `frontend`.

```bash
npm i @bluelibs/x-ui @apollo/client
npm i react react-dom react-router-dom
```

## Setup

We begin by defining our kernel, and our initial bundle

```tsx title="kernel.ts"
import { Kernel } from "@bluelibs/core";
import { XUIBundle } from "@bluelibs/x-ui";
import { UIAppBundle } from "@bundles/UIAppBundle";

// All UI bundles need to be prefixed with UI
// All X-Framework bundles have the first prefix X
export const kernel = new Kernel({
  bundles: [
    new XUIBundle({
      graphql: {
        // ApolloClient Options
        // https://www.apollographql.com/docs/react/api/core/ApolloClient/#ApolloClientOptions
        uri: process.env.REACT_APP_GRAPHQL_URI,
      },
    }),
    new UIAppBundle(),
  ],
});
```

Now create a sample `UIAppBundle`, and we ask it to load the routes.

```ts
import { Bundle } from "@bluelibs/core";

export class UIAppBundle extends Bundle {}
```

And now we can finally render.

```tsx
import { kernel } from "./kernel";
import { XUIProvider } from "@bluelibs/x-ui";
import React from "react";
import ReactDOM from "react-dom";

ReactDOM.render(
  <XUIProvider kernel={kernel} />,
  document.getElementById("root")
);
```

## Routing

We add routes through the `XRouter`. Routes are added programatically. Behind the scenes we use `react-router-dom` .

```tsx
import { Bundle } from "@bluelibs/core";

export class UIAppBundle extends Bundle {
  async init() {
    const router = this.container.get(XRouter);

    router.add({
      HOME: {
        path: "/",
        component: () => <h1>Hello world!</h1>,
        // All other properties from react-router-dom can be added here
      },
    });
  }
}
```

Our strong recommendation is to never rely on strings for routes, this is why we'll add them in a route map and use it like this:

```ts title="routes.ts"
export const HOME = {
  path: "/",
  component: () => <h1>Hello world!</h1>,
};

export const USER_VIEW = {
  path: "/users/:_id",
  // Route parameters are injected in the component's props
  component: ({ _id }) => <h1>Hello user {_id}!</h1>,
};

export const SEARCH = {
  path: "/search",
  // Query variables (/search?q=something), are all injected inside `queryVariables` property
  component: ({ queryVariables }) => (
    <h1>You are searching {queryVariables.q}</h1>
  ),
};
```

And now simply add them in your bundle like this:

```ts
import * as Routes from "./routes";

// The function from the Bundle
class UIAppBundle extends Bundle {
  async init() {
    const router = this.container.get(XRouter);

    router.add(Routes);
  }
}
```

Using the link and generating it:

```tsx
import { useRouter } from "@bluelibs/x-ui";
import * as Routes from "{path}/routes.ts";
import { Link } from "react-router-dom";

function Component() {
  // router.path gets you the path
  // router.go also pushes it to history

  const router = useRouter();
  return (
    <div>
      <Link to={router.path(HOME)}>Home Link</Link>
      <button onClick={() => router.go(HOME)}>Take me home</button>
      <Link to={router.path(USER_VIEW, { params: { _id: "123" } })}>
        Parameter Login
      </Link>
      <Link to={router.path(SEARCH, { query: { q: "value" } })}>Home Link</Link>
    </div>
  );
}
```

### Authorisation

The routes also support a `roles: []` option:

```ts
export const PROTECTED_VIEW = {
  path: "/users/:_id",
  component: ({ _id }) => <h1>Hello user {_id}!</h1>,
  // Ensure that each user returns the 'USER' in the roles request. This basically says: you are logged in.
  roles: ["USER"],
};
```

An alternative would be to `useGuardian()` and check for the role.

If the user doesn't have the role we render the `NotAuthorized` component. Which can be overridden.

## Dependency Injection

We have succcesfully blended D.I. with React. The concept is easy, you control your container inside the `prepare()` or `init()` phase of a bundle, you use it inside React. The right container is properly passed because everything is wrapped in `<XUIProvider />`.

```ts
import { useContainer, useRouter, use } from "@bluelibs/x-ui";

class A {}

function Component() {
  const container = useContainer();
  // You fetch the singleton instance of A
  const a = use(A);
  // Just like we used router above
  const router = useRouter();
}
```

## GraphQL

We use `@apollo/client` so in theory, all you have to do is just use it. You can [follow the official guideline here](https://www.apollographql.com/docs/react/api/react/hooks/), they will work outside the box without changing anything.

```tsx
import { ApolloClient } from "@bluelibs/x-ui";

function Component() {
  // Note, that we implement our own ApolloClient which extends the base one, so we can properly create the links and everything
  const apolloClient = use(ApolloClient);
}
```

## Collections

Collections are an interface to your remote database via `GraphQL` as long as the remote queries and mutations respect a specific interface. That interface you get it in a snap when you create a `GraphQL CRUD` from the cli command `x`.

```ts
import { Collection } from "@bluelibs/x-ui";
import { Post } from "./Post.model";

export class Post {
  _id: any;
  title: string;
  isApproved: boolean;
}

export class PostsCollection extends Collection<Post> {
  getName() {
    // This is the endpoint name of the crud
    // Queries: postsFind, postsFindOne, postsCount
    // Mutations: postsInsertOne, postsUpdateOne, postsDeleteOne
    return "posts";
  }
}
```

### Queries

Below, we'll have a simple example how to use the posts collection to find data.

```tsx
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
// The request can span-out on many lines, sometimes it's good to define them outside a component
```

We also support relational data, if relations are defined with `Nova` in the backend:

```ts
postsCollection.find(
  {},
  {
    _id: 1,
    title: 1,
    author: {
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

### Transformers & Serializers

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

### Mutations

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

### Extending Collections

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

### Hooks

Integration with React is seamless and painless:

```tsx
import {
  useData,
  useLiveData,
  useDataOne,
  useLiveDataOne,
} from "@bluelibs/x-ui";

function PostsList() {
  const {
    data: posts,
    isLoading,
    error,
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
} = useDataOne(PostsCollection, new ObjectId(props.id), body);
```

### Lists

We have created a `Smart` that allows you to easily work with lists:

```ts title="PostListSmart.ts"
import { ListSmart } from "@bluelibs/x-ui";
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
import { useLiveData } from "@bluelibs/x-ui";

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
When using live data and relations, it is by design to not have reactivity at nested levels. For example if someone updates the comments' text it won't trigger a reactive change. Instead you will have to create separate component that subscribes to that comment via `useLiveData()`.
:::

## Integration with Smart

Smart is a very small library which allowes you to integrate logic and state together in a separated class.

The difference here is that `Smart` from this package, allows you to work with the D.I. container:

```ts
import { Smart, useSmart, newSmart } from "@bluelibs/x-ui";

class MySmart extends Smart<any, any> {
  @Inject()
  eventManager: EventManager;
}

function Component() {
  const [mySmart, Provider] = newSmart(MySmart);

  // mySmart has been instantiated by the container, seemlessly
}
```

## Guardian

The guardian is a smart that communicates with the server, providing authentication methods for `register`, `login`, `logout`, `changePassword`, `forgotPassword`, resetPassword, verify email.

Explore the examples [in this boilerplate](https://githubs1.com/bluelibs/x-boilerplate/tree/main/microservices/ui/src/bundles/UIAppBundle/pages/Authentication)

It also handles fetching the user data using the `me` standard query, but this behavior can be later changed.

Basic usage:

```tsx
function Component() {
  const guardian = useGuardian();
  const router = useRouter();

  onLogin = () {
    guardian.login("username", "password").then(result => {
      router.go(HOME)
    })
  }
}
```

Let's use guardian in our components

```tsx
function TopBar() {
  const guardian = useGuardian();

  const {
    // This happens on first page load, if the Guardian has finished reading the token and fetching the user (if exists)
    initialised,
    isLoggedIn,
    // This happens when Guardian initialises and the stored token has expired and can no longer be used
    hasInvalidToken,
    // This is true after logging in, or when initialising we fetch the user via me() query
    // This gets false after the me() query has returned or errored
    fetchingUserData,
    user,
  } = guardian.state;

  // In this realm the component will re-render automatically if the user logs in, just use the variables from state.

  // it checks for roles: []
  const isAdmin = guardian.hasRole(Roles.ADMIN);
}
```

The user type is the default one from `XPasswordBundle`:

```ts
type GuardianUserType = {
  _id: string | object | number;
  profile: {
    firstName: string;
    lastName: string;
  };
  roles: string[];
  email: string;
};
```

### Extending the Guardian

There are several reasons you would want to extend the guardian, most popular being

1. Change registration input
2. Fetch different set of data of the logged in user

```ts
import {
  GuardianSmart,
  GuardianUserType,
  GuardianUserRegistrationType,
} from "@bluelibs/x-ui";

// configure your types, optionally extend the default guardian user types we imported
type AppUserType = GuardianUserType & {
  profile: {
    fullName: string;
    gamerScore: number;
  };
};

class AppGuardianSmart extends GuardianSmart<AppUserType> {
  retrieveUser(): Promise<AppUserType> {
    // you have access to this.authenticationToken
    return this.apolloClient
      .query({
        // custom query
      })
      .then((response) => {
        return response.data.me;
      });
  }
}
```

We specify this class when we initialise `XUIBundle()`:

```tsx
new XUIBundle({
  guardianClass: AppGuardianSmart,
});
```

The `register` calls the `registration` mutation with the GraphQL input: `RegistrationInput`. It's enough to change the input on the server-side by overriding `registration` mutation in `XPasswordBundle`.

However if you want to extend the interface of `Guardian`, meaning you add other methods or add other variables to the existing methods, then besides overriding the `guardianClass` you need to create your own hook, to benefit of autocompletion.

```tsx
const appGuardian = (): AppGuardianSmart => {
  return useGuardian() as AppGuardianSmart;
};
```

## Events

You can use the classic `EventManager` to emit events, but if you want to have a component listen to events during its lifespan (until it gets unmounted), you can use the hook: `useListener`.

```tsx title="Emitting Events"
import { useListener, listen, useEventManager } from "@bluelibs/x-ui";
import { Event } from "@bluelibs/core";

class MyEvent extends Event {}

function SomeComponent() {
  const eventManager = useEventManager();
  eventManager.emit(new MyEvent());
}

function OtherComponent() {
  // Use memo to avoid duplication of functions, or use an outside function
  const handler = useMemo(() => {
    return (e: MyEvent) => {
      // handle the event, change the state, or whatever
    };
  });

  // The built-in hook lets you listen to events while the component is mounted
  useListener(MyEvent, handler);

  // Analog to useListener which can be confusing is the same function that does the same thing, use what fits best to your ears
  listen(MyEvent, handler);
}
```

## Sessions

We often need to store values somewhere that we later use it in our application, sometimes those values we want to be persisted in `localStorage` or somewhere so after refresh they can still be accessed.

`useUISession()` is a hook that allows for handling sessions easily. You can and add custom handlers on field change and persist the data to local storage.

In order to modify the interface and benefit of autocompletion, you have to extend it:

```ts title="declarations.ts";
import "@bluelibs/x-ui";

declare module "@bluelibs/x-ui" {
  export interface IUISessionStore {
    csrfToken: string;
  }
}
```

The hook provides the following methods:

```tsx
import { useUISession, UISessionStateChangeEvent } from "@bluelibs/x-ui";

const session = useUISession();

/* returns the value of a field. */
const csrfToken = session.get("csrfToken");

/* sets a field to a value, e.g. set("lastAuthenticationDate", new Date());
if you want to wait for the event emissions to run, you must use await.
you will want to use `options` in order to persist data to localStorage. */
await session.set(fieldName, value, {
  // optional options
  persist: true,
});

session.onSet(fieldName, (e: UISessionStateChangeEvent) => {
  // You have access to the field logic here:
  // e.data.fieldName
  // e.data.previousValue
  // e.data.value
});

// Ideally you would store your above function in a handler
session.onSetRemove(handler);
```

### Example

```tsx
import {
  useUISession,
  useGuardian,
  UISessionEventChangeHandler,
} from "@bluelibs/x-ui";

// We define the handler: what to do when a field changes?
const authenticationDateHandler: UISessionEventChangeHandler = (event) => {
  const {
    data: { value, previousValue },
  } = event;

  console.log("Values have changed: ", { value, previousValue });
};

function Component() {
  const session = useUISession();
  const guardian = useGuardian();

  const lastAuthenticationDate = session.get("lastAuthenticationDate");

  useEffect(() => {
    session.onSet("lastAuthenticationDate", authenticationDateHandler);
  }, []);

  const onSubmit = () => {
    guardian.login(username, password).then(() => {
      session.set("lastAuthenticationDate", new Date(), {
        persist: true,
      });
    });
  };

  return (
    <div>
      {/* ...login form */}
      Last authentication: {lastAuthenticationDate?.toDateString()}
    </div>
  );
}
```

Note:

For handlers, you'll want to declare them outside of a React component, such that they won't change their memory address. Otherwise, you won't be able to remove them,
since onSetRemove identifies a handler by comparing functions, which is done on the actual reference.

### Defaults

When initialising `XUIBundle()`, you can pass session defaults:

```ts title="kernel.ts";
export const kernel = new Kernel({
  bundles: [
    // other bundles
    new XUIBundle({
      session: {
        defaults: {
          csrfToken: null,
        },
        localStorageKey: "SESSION_LOCAL_STORAGE_KEY",
      },
    }),
  ],
});
```

## UI Components

You have the ability to craft and override UI components:

```ts
function Component() {
  const UIComponents = useUIComponents();

  return <UIComponents.Loading />;
}
```

Overriding them is done in the `init()` phase of your bundle

```ts
import { Bundle } from "@bluelibs/core";
import { XUIBundle } from "@bluelibs/x-ui";

class UIAppBundle extends Bundle {
  async init() {
    const xuiBundle = this.container.get(XUIBundle);
    xuiBundle.updateUIComponents({
      Loading: MyLoadingComponent,
    });
    // Now everywhere it's used it will render it correctly
  }
}
```

Creating new components is done in two steps, first we extend the interface, second we update the components as shown in the overriding phase:

```ts title="defs.ts"
import "@bluelibs/x-ui";

declare module "@bluelibs/x-ui" {
  export interface IComponents {
    MyCustomOne: React.ComponentType<OptionalPropsType>;
  }
}
```

## I18N

We are leveraging the awesome [Polyglot](https://airbnb.io/polyglot.js/) package maintained by Airbnb.

```ts
new XUIBundle({
  i18n: {
    defaultLocale: "fr", // default is "en",
    // You can omit this if you want to use the default options for polyglots
    polyglots: [
      // ...rest represents the rest of custom options for Polyglot constructor, includign phrases
      { locale: "en", ...rest },
    ],
  },
});
```

```ts
import { useTranslate } from "@bluelibs/x-ui";

function Component() {
  const t = useTranslate();

  return <h1>{t('pages.home.header.text')</h1>;
}
```

Changing the language of the default:

```ts
import { I18NService } from "@bluelibs/x-ui";

class UIAppBundle extends Bundle {
  async init() {
    const i18n = this.container.get(I18NService);

    // Add messages to your locale
    i18n.extend("en", messages);

    // get it from window.locale or session, or cookies, or however you find fit
    const locale = "";
    i18n.setLocale(locale);
  }
}
```

When you change your language from the app simply use the `I18NService` and run `setLocale()`.
