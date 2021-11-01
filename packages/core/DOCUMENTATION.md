This is the "glue" that sticks all of our modules together. It relies on certain patterns to achieve these goals, which we shall explore step by step in this documentation.

## Install

```bash
npm install --save @bluelibs/core
```

## Purpose

We needed a way to run our modules in such a way that they can work together (inter-operate). To achieve this in Node & TypeScript, we had to write an Aynchronous Event Processor to give us the flexibility of blocking certain events emissions, giving us ability to have a very scalable infrastructure for composition.

When working on multiple bits of logic, it's important that you can "tune-in" in certain functions and override them. To achieve this goal we used `Dependency Injection` paradigms transformed into a modern solution that works both on the server and on the client (isomorphic).

These elements paved the way to constructing the `Kernel` which is a set of modules (we will call them **bundles** from now on). The `Kernel` looks something like this:

```ts
const kernel = new Kernel({
  bundles: [
    // Toolkit that maybe opens an express server and makes it easy for the user to create routes
    new APIBundle(),

    // Integrates with a database giving you access to use it
    new DatabaseBundle({
      uri: "acmesql://127.0.0.2/shop",
    }),

    // Here we work with our available modules to create an application
    new ApplicationBundle(),
  ],
});

kernel.init().then(() => {
  console.log("I am alive.");
});
```

As you can notice, we have the kernel and its bundles. Bundles can communicate with each other through `Dependency Injection` and `Asynchronous Event Manager`, which we are going to explore before diving deeper.

## Dependency Injection

This design pattern solves the problem with modifying or extending logic of other bundles.

An oversimplification of D.I. is that you don't depend on "real" implementations, you depend on references (strings, classes, objects). For example, let's say you have a container that contains everything you need in your app, connection to the database, credentials, anything.

And let's say you want to insert something in the database and you store this logic somewhere, instead of getting the logic handler directly (by `new DatabaseService()`-ing it, or accessing the singleton `DatabaseService.doSomething()`), you use the container:

```ts
import { ContainerInstance } from "@bluelibs/core";

class DatabaseService {
  insert(collection: string, value: any) {
    // Do something
  }
}

const container = new ContainerInstance();

// Service identifiable by a "string"
container.set({ id: "database_service", type: DatabaseService });
// This will be the singleton instance of DatabaseService
const databaseService = container.get<DatabaseService>("database_service");

// Defining services through tokens:
const DATABASE_SERVICE_TOKEN = new Token<DatabaseService>("DATABASE_SERVICE");
container.set({ id: DATABASE_SERVICE_TOKEN, type: DatabaseService });

// Using tokens you gain type automatically infered and no-string-collisions in the future
const databaseService = container.get(DATABASE_SERVICE_TOKEN);

// Another handy alternative is to use the actual class as the identifier
// This might seem a bit weird, but most of the times our classes are singletons, and we can still override them
container.set({ id: DatabaseService, type: DatabaseService });
const databaseService = container.get(DatabaseService);

// Even if you did not set it in the container,
// It automatically registers it as a singleton if it doesn't exist and it's a class
container.get(DatabaseService);
```

Now let's say the `databaseService` needs some credentials and a host to connect to. So instead of using a string directly or reading directly from env, it reads it from container:

```ts
import { ContainerInstance, Inject } from "@bluelibs/core";

class DatabaseService {
  databaseUri: string;
  client: RawDatabaseClient;

  constructor(@Inject("database_uri") databaseUri) {
    // Just a sample for illustration
    this.databaseUri = databaseUri;
    this.client = acmesql.connect(databaseUri);
  }
}

const container = new ContainerInstance();

// Note it's value not type, types get instantiated as they refer to classes
container.set({ id: "database_uri", value: "acmesql://127.0.0.2/app" });

const databaseService = container.get(DatabaseService);
databaseService.databaseUri; // acmesql://127.0.0.2/app
```

In conclusion, we never instantiate via `new` we only fetch instances of our services through the container, and there's only one container which is provided by the `Kernel` (accessible via `kernel.container` or `this.container` inside `Bundle` methods).

### Services

If your application was an army, the services are your soldiers. They do: data manipulation, internal comms with the database, crunching massive amounts of data, heating up the CPUs. Their supperiors are the "Controllers" which decide which services to get called and when.

Let's regard them as units of logic stored in classes which can depend on things from the container.

```typescript
import { Service, ContainerInstance } from "@bluelibs/core";

const container = new ContainerInstance();

@Service()
class A {
  init() {
    return true;
  }
}

// You don't need to set it from the container
// It's automagically created on demand.

const a = container.get(A);
a.init(); // true

// Services are by default singletons:
const a = container.get(A);
a === container.get(A); // true

// You can use @Service({ transient: true }) if you want a new instance everytime
// Be careful.
```

Services, just like soldiers, depend on one another:

```ts
@Service()
class DatabaseService {}

@Service()
class PaymentService {
  // If you want to expose databaseService you can also make it public,
  // but it's best to avoid treating a service as a "proxy" to access another service
  // The way we design dependencies is important.
  protected databaseService: DatabaseService;

  constructor(
    // This is what we call "constructor" injection
    @Inject(() => DatabaseService)
    databaseService
  ) {
    this.databaseService = databaseService;
  }

  charge(id: string, amount: number) {
    // Just an example to illustrate the idea
    this.databaseService.insert("charges", { id, amount });
  }
}

// Now everything will be automatically injected
// Even if DatabaseService hasn't been initialised, yet, you don't have to worry.
const paymentService = container.get(PaymentService);
```

We saw `constructor injection`, but there's another way, which seems simpler, but comes with a price:

```ts
@Service()
class B {}

@Service()
class A {
  // Note the function
  @Inject(() => B)
  b: B;

  // You avoid a lot of code and cleans your constructor() function.
}
```

The problem here is the following, if by any chance you have a constructor, that needs a service defined:

```ts
class A {
  @Inject(() => B)
  b: B;

  constructor() {
    this.b; // undefined!
  }
}
```

This happens because property injection happens right after the instantiation of the class. You can merge the approaches.

:::note
There can be situations where you would want to inject the container. This is done by using `@Inject(ContainerInstance)`. We advise injecting container only as a last resort, because we want to compute dependencies before the service can take requests, otherwise it may lead in a runtime error. At the same time, we understand that sometimes you do need the `container`, we just wanted to raise awareness.
:::

### Transience

There's another trait to services called "transience", meaning you can have services which are instantiated everytime:

```ts
@Service({
  transient: true,
})
class A {
  constructor() {
    console.log("every time");
  }
}

const a1 = container.get(A); // will print "every time"
const a2 = container.get(A); // will print "every time"

a1 !== a2; // true, they are different instances
```

### Tokens

It's never good to rely on strings as identifiers, because sometimes they can collide, and they don't infer types. `Token` comming to the rescue! It ensures no collisions can happen and also helps us with infering the type without as having to specify it.

```ts
import { Service, Inject, Token } from "@bluelibs/core";

@Service()
class Emptyness {}

// We specify the type of the token to offer us autocompletion
const MY_SERVICE_TOKEN = new Token<Emptyness>();

container.set({ id: MY_SERVICE_TOKEN, type: Emptyness });
container.get(MY_SERVICE_TOKEN); // a singleton `Emptyness` instance

// You have the two ways of injecting things in a class:
class A {
  // You no longer need a function where classes were identifiers
  @Inject(MY_SERVICE_TOKEN)
  emptyness: Emptyness;

  constructor(@Inject(MY_SERVICE_TOKEN) emptyness: Emptyness) {
    this.emptyness = emptyness;
    // Both solutions work well (property injection/constructor injection)
    // Just do what you feel is easier
  }
}
```

## Async Event Management

Translating this into simple terms: it's letting everyone know what you did, or what you're about to do, and giving them a chance to share their input and/or perform certain specific actions.

Let's say your boss comes in, slams the door, and says: "We just closed a good deal, this friday will be a paid day-off for everybody.". Everyone cheerful, they decide to go out to a pub.

The story above illustrated the event-driven approach of life. People emit vocal frequencies into the world, emitting information to others, enabling others to act upon that information. You can imagine the `EventManager` is bringing life into your application.

### Events Definition

Let's explore how we define a type-safe event. Note that we can also have events without a type because there are situations where you don't need them, but most events carry additional data with them so they can be properly processed by the listeners.

[Access the code from here](https://stackblitz.com/edit/typescript-jg9osn?file=index.ts)

Let's code a simple one:

```typescript
import { EventManager, Event } from "@bluelibs/core";

class UserCreatedEvent extends Event<{
  // This is what information you need to pass when creating the event
  // It can be omitted if events don't store any data
  userId: string;
}> {}

// The EventManager is the service that handles everything regarding events
const manager = container.get(EventManager);

// Note we use the same class
manager.addListener(UserCreatedEvent, event => {
  // `event` type automatically infered + autocompletion

  // The data provided in event's constructor is found in event.data property
  console.log(event.data.userId);
});

manager
  .emit(
    // Each Event is a class instance.
    new UserCreatedEvent({
      userId: "XXX",
    })
  )
  .then(() => {
    // This will wait for all async listeners to run
    console.log("All async listeners have returned back home.");
  });

const handler = () => Infinity;
manager.addListener(UserCreatedEvent, handler);
manager.removeListener(UserCreatedEvent, handler);

// You can listen to absolutely all events that get dispatched and see their data
// Imagine this as a proxy, can be used for logging all events into a database
manager.addGlobalListener(handler);
manager.removeGlobalListener(handler);
```

Adding listeners has some extra goodies, one would be specifying the `order` in which the events are executed. Sometimes you have, let's say, 2 listeners for the `UserCreatedEvent`, one sends an welcoming email, the other creates a monthly subscription. You want to add a third one, but you want it to be done before everything else, because you maybe check some info for the `User` and you might want to be able to "cancel" the event execution:

```typescript
manager.addListener(
  UserCreatedEvent,
  async e => {
    if (notOk(e.data.userId)) {
      throw new Exception("This will cancel all other listener's execution");
    }
  },
  {
    order: -1000, // the lowest get executed first, by default order = 0

    /**
     * Order can be any number you wish (even: Infinity).
     * We advise sticking to -1000 <> 1000 as it feels suffice for many cases. (less is more)
     *
     * As your application scales, if maintaining the order of events becomes a hassle,
     * try merging events and have business-logic rule of execution done by a specialised service.
     *
     * We recommend sticking to services in the beginning, and you have an easy way to scale later.
     */
  }
);
```

You can also add a filter to the option, that will only allow certain "instances" of events. Let's say everytime you insert an object into the database you emit an event that contains also the collectionName in it. And you would like to listen to events for a certain collection:

```typescript
class ObjectInsertedEvent extends Event<{
  collectionName: string;
}> {}

manager.addListener(
  ObjectInsertedEvent,
  async e => {
    // Do something when the event
  },
  {
    filter: e => e.data.collectionName === "users",
  }
);
```

This is just a shorthand function so it allows your handler to focus on the task at hand rather than conditioning execution.

### Listeners

What are events without someone to listen to? They would get lost in the void.

We can add listeners via `addListener` from the `EventManager` which we get from the `container`, but we also have a more elegant way.

```typescript
import { Listener, On } from "@bluelibs/core";

// The base Listener class has a init() function that registers the events accordingly
class NotificationListener extends Listener {
  @On(UserAddedEvent, {
    /* order, filter */
  })
  onUserAdded(e: UserAddedEvent) {
    // Do something
  }
}
```

:::note
All listeners must be warmed up in the bundles for them to work. This is explained in more detail in the [bundles chapter](#bundles).
:::

Are listeners services? No. Well yes. They are services, from the `container` perspective, the listener is just another singleton, however from our perspective we regard `listeners` as `controllers`. Meaning they delegate the job to another service.

In the case above inside `onUserAdded`, we would do something like:

```ts
class NotificationListener extends Listener {
  @Inject(() => NotificationService)
  notificationService: NotificationService;

  @On(UserAddedEvent, {
    // You can add aditional options, like you can do inside `addListener`
    /* order, filter */
  })
  onUserAdded(e: UserAddedEvent) {
    this.notificationService.send({
      userId: e.data.userId,
      text: "Welcome to the application!",
    });
  }
}
```

In conclusion, keep your listeners clean, treat them as controllers, let the services do the work.

### Naming Conventions

The naming convention is simple `{ConcernTopDown}{Happening}Event`, exampels of concern can be: `User`, `Order`, `OrderPayment`, top-down means that you should define the events started with your main concern to form an alphabetical grouping useful when reading the folder as well:

```yaml
- OrderProcessedEvent
- OrderPreparedForDeliveryEvent
```

The happening can be of two types:

1. Before something happens: `BeforeCreate`, `BeforeRequest`, `BeforePayment`.
2. After something happens: `Created`, `Requested`, `Paid`.

Together they can form examples such as: `UserBeforeCreateEvent`, `OrderPaymentPaid`, etc.

## Bundles

The `Kernel` is nothing without its precious bundles. Bundles contain the logic.

```typescript
import { Bundle } from "@bluelibs/core";

class AppBundle extends Bundle {
  async init() {
    // This is invoked when kernel is initialised
    console.log("I am alive.");
  }
}
```

You can add the bundle to the `kernel` in the constructor or later on:

```typescript
const kernel = new Kernel({
  bundles: [new AppBundle()],
});

// Add bundles outside constructor
kernel.addBundle(new OtherBundle());

kernel.init().then(() => {
  // At this stage all the bundles `init()` function have been called.
});
```

Initialisation process prepares and initialiases all the bundles registered inside it. You can regard your `Bundles` as groups of independent logic or strongly separated concerns.
Ok, now that you've learned the basics of containers and async event management, it's time to understand where all logic lies (inside the bundles and their services)

### Configuration

Bundles can have a specific configuration to them and this is passed when instantiating them:

```ts
import { Bundle } from "@bluelibs/core";

type SaaSConfigType = {
  subscriptionFee: number;
  currency: string;
};

class SaaSBundle extends Bundle<SaaSConfigType> {
  async init() {
    // You have access to the configuration in here: this.config
  }
}

// You pass the config inside the bundle's constructor
kernel.addBundle(
  new SaaSBundle({
    subscriptionFee: 100,
    currency: "USD",
  })
);
```

You can also specify a default configuration for your bundle. The config you pass when constructing the bundle gets merged deeply with `defaultConfig`.

```ts
class SaaSBundle extends Bundle<Config> {
  defaultConfig = {
    currency: "USD",
  };
}
```

Another feature regarding configuration is providing a required config. A config that you must always pass:

```ts
type RequiredConfig = {
  subscriptionFee: number;
};

class SaaSBundle extends Bundle<Config, RequiredConfig> {}

new SaaSBundle({
  // Must be provided
  subscriptionFee: 100,
});
```

We decided to make this split because we want developers to force a specific value for a bundle that wouldn't be feasible to have it in `defaultConfig`.

You can also have more complex validation logic via `validate()`:

```ts
class SaaSBundle extends Bundle<Config, RequiredConfig> {
  async validate(config) {
    // Ensure that the provided config is ok
    // Throw an exception if it's not ok.
  }
}
```

### Lifecycle

Right now you've seen that bundles get initialised via the `init()` async function. But there's more to it because we wanted to allow bundles to work together and extend each other.

```typescript
class MyBundle extends Bundle<MyBundleConfig> {
  // This runs first, and its main purpose is to extend the kernel by adding dependencies
  // Here you should only use the `addDependency` method from the bundle.
  async extend() {}

  // Here you can hook to bundle events
  // For example (before or after a specific bundle initialises)
  async hook() {}

  // Here you can basically prepare for initialisation, for example registering listeners, etc
  // You can regard this as container-preparation phase.
  async prepare() {}

  // The final step in the bundle's lifecycle. This is where bundles usually start event loops (you start express), or connect to the database
  async init() {}
}
```

Kernel also emits the following events (name descriptive enough), and listeners are run in-sync:

- KernelBeforeInitEvent
- BundleBeforePrepareEvent
- BundleAfterPrepareEvent
- BundleBeforeInitEvent
- BundleAfterInitEvent
- KernelAfterInitEvent


### Extending

If you have a bundle which depends on other bundles, and you want to make sure they're in the kernel,
you can add them in them `extend` phase, using `addDependency()`:

```ts
import {
  Bundle,
  Events,
  EventManager,
  Event,
  BundleAfterPrepareEvent,
} from "@bluelibs/core";

class MyBundle extends Bundle {
  async extend() {
    await this.addDependency(DatabaseBundle, {
      // optional initialisation config
    })
  }
}
```

:::note
`addDependency` will only add the bundle if it's not already in the kernel.
:::
### Hooking

So, in theory you have the chance to hook even more to the bundles you love:

```ts
import {
  Bundle,
  Events,
  EventManager,
  Event,
  BundleAfterPrepareEvent,
} from "@bluelibs/core";

class MyBundle extends Bundle {
  hook() {
    // Let's say you want to do stuff, after MyOtherBundle gets prepared.
    const manager = this.container.get(EventManager);

    manager.addListener(
      BundleAfterPrepareEvent,
      async e => {
        // Do something
      },
      // Optional filter
      {
        filter: e => e.data.bundle instanceof MyOtherBundle,
      }
    );
  }
}
```

### Credentials and Keys

Let's say we have a bundle that needs an API key, for example, `MailBundle` needs some authentication parameters. The way we connect Bundle's config to the container is by setting some constants into the container which the services use in their instantiation.

```typescript
import { Inject, Service, Token, Bundle } from "@bluelibs/core";

// {bundle}/constants.ts
const Constants = {
  API_KEY: new Token<string>(),
};

// {bundle}/services/MailService.ts
@Service()
class MailService {
  constructor(@Inject(Constants.API_KEY) protected readonly apiKey: string) {}

  send() {
    // access this.apiKey
  }
}

// {bundle}/{bundle}.ts
interface IMailBundleConfig {
  apiKey: string;
}

class MailBundle extends Bundle<IMailBundleConfig> {
  async prepare() {
    // We do this in prepare() phase
    this.container.set(Constants.API_KEY, this.config.apiKey);
  }
}
```

### Warming-up Services

Warming up instantiates the specific Service, and if the `init()` function exists it will be called.
For example, you might use this for a DatabaseConnection, you want to immediately connect and you implement this in the service's `init()` function.

```typescript
@Service()
class DatabaseService {
  async init() {
    // Do something
  }
}

class AppBundle extends Bundle {
  async init() {
    await this.warmup([DatabaseService]);
  }
}
```

## Exceptions

It's nice to never rely on string matching to see which exception was thrown, and it's nice to have typesafety as well. We recommend you always use this instead of the standard `Error`. The reason we changed the name to `Exception` instead of Error was to avoid confusion that these class would somehow extend the `Error` class.

```typescript
import { Exception } from "@bluelibs/core";

class UserNotAuthorizedException extends Exception<{
  userId: string;
  context: string;
}> {
  // optional specify a code for easy search
  // please note that if you do this, you have to manage it properly
  static code = "K10581";

  getMessage() {
    const { userId, context } = this.data;

    return `User with id ${userId} was denied access while trying to access: ${context}`;
  }
}

throw new UserNotAuthorizedException({
  userId: "123",
  context: "viewUserProfile",
});
```

```typescript
try {
  viewUserProfile(profileId, { userId });
} catch (e) {
  if (e instanceof UserNotAuthorizedException) {
    // Do something
    // You can access: e.message to see the compiled message + optionally prefixed with the code
  }
}
```

## Global Parameters

Kernels may store global data which is accessible through the container. This can be information which describes whether we're running in a specific environment (development, testing, production), it can be anything you see fit. We do not see many use-cases for this as we push for having configuration passed down at the `Bundle` level, but when you need it, these are our "global parameters".

```js
new Kernel({
  parameters: {
    // Just some examples, they can be anything
    applicationUrl: "https://www.google.com/",
    debug: true,
  },
});

// Fetching them is getting the string wrapped in %%
const applicationUrl = container.get("%applicationUrl%");

// Or you can get them via kernel.parameters
```

You can inject parameters from kernel, or others like this:

```typescript
@Service()
class A {
  // Inject via property
  @Inject("%debug%")
  protected isDebug: boolean;

  // Inject via constructor
  constructor(@Inject("%applicationUrl%") applicationUrl: string) {
    // Do something based on the context
  }
}
```

To benefit of autocompletion for your kernel parameters, extend the `IKernelParameters` interface:

```ts title="defs.ts"
import "@bluelibs/core";

declare module "@bluelibs/core" {
  export interface IKernelParameters {
    applicationUrl: string;
  }
}
```

By default the available parameters are:

```ts
export interface IKernelParameters {
  debug: boolean; // Whether you are using in debug mode
  testing: boolean; // Whether you are using the kernel to run tests
  context: KernelContext;
}

export enum KernelContext {
  DEVELOPMENT = "development",
  PRE_PRODUCTION = "pre-production",
  PRODUCTION = "production",
}
```

## Advanced Bundles

:::note When would you like to do this?
This would be suited when you expose a bundle in which you allow a certain service to be overriden.
:::

Keep your bundle easily modifiable by allowing injection of customised services. The strategy is to use an `abstract class` as a placeholder, but there are other solutions as well.

Let's think of a bundle that does some security thingies and they want to allow you to inject a custom hash function.

```typescript
abstract class HashService {
  hash(str: string) {
    return md5(str);
  }
}

// a placeholder, or declare hash abstract and implement it here, your choice or a mixture of both depending on the use-case
class DefaultHashService extends HashService {}

class SecurityBundle extends Bundle<{ hasher: HashService }> {
  defaultConfig = {
    hasher: DefaultHashService,
  };

  prepare() {
    // We bind HashService, to use a different constructor
    this.container.set({ id: HashService, type: this.config.hasher });
  }
}

// adding it when you instantiate the bundle
kernel.addBundle(
  new SecurityBundle({
    hasher: ExtendedHashService,
  })
  // Now every service that depends on HashService will be overriden
);
```

This strategy is to explicitly state which hasher you want in the constructor, but in real-life scenarios, you'll most likely do this inside your own `AppBundle`:

```typescript
class SecurityExtensionBundle extends Bundle {
  async prepare() {
    // We use the `updateConfig` command
    const bundle = this.container.get(SecurityBundle);
    bundle.updateConfig({
      hasher: MyExtendedHasher,
    });
  }
}
```

This strategy may feel a bit obscure as you allow any bundle to modify the config at any stage, if you want to prevent such things happening to your bundle, you can do something like:

```typescript
class SecurityBundle extends Bundle {
  // You can override this method to ensure the changes you allow to your modules are more verbose.
  updateConfig() {
    throw new Error(
      `Please use the exposed methods of this bundle to override config.`
    );
  }

  setHasher(hasher: HashService): void {
    Object.assign(this.config, { hasher });
  }
}

// And now you call setHasher instead of updateConfig.
```

:::info
If you want to have more control over the `setHasher` you can use `bundle.phase` to ensure that it is set within the preparation or initialisation phase.
:::

```ts title="Phases for bundles and kernel"
export enum KernelPhase {
  DORMANT = "dormant",
  EXTENDING = "extending",
  BUNDLE_SETUP = "bundle-setup",
  HOOKING = "hooking",
  PREPARING = "preparing",
  INITIALISING = "initialising",
  INITIALISED = "initialised",
  FROZEN = INITIALISED,
  SHUTDOWN = "shutdown",
}

export enum BundlePhase {
  DORMANT = "dormant",
  EXTENDING = "extending",
  EXTENDED = "extended",
  SETUP = "setup",
  HOOKING = "hooking",
  HOOKED = "hooked",
  BEFORE_PREPARATION = "preparing",
  PREPARED = "prepared",
  BEFORE_INITIALISATION = "initialising",
  INITIALISED = "initialised",
  FROZEN = INITIALISED,
  SHUTDOWN = "shutdown",
}
```

## Testing

We recommend using [jest](https://jestjs.io/) for testing. The idea here is that when you have a `kernel` with multiple bundles, sometimes your bundles might behave differently, this is why we have a kernel parameter called `testing`.

```ts
const kernel = new Kernel({
  bundles: [],
  parameters: {
    testing: true,
  },
});
```

When testing the full kernel you need to have an ecosystem creation function. We recommend having a separate `kernel.test.ts` file where you instantiate the kernel.

```ts title="__tests__/ecosystem.ts"
import { kernel } from "../startup/kernel.test";

const container = kernel.container;

export { container, kernel };

export async function createEcosystem() {
  await kernel.init();
}

beforeAll(async () => {
  return createEcosystem();
});

afterAll(async () => {
  // This will call shutdown() on all bundles
  // This is useful when you want to stop db connections or server loops
  await kernel.shutdown();
});
```

Ensure that the code above is loaded before all tests. Now you would be able to run your tests:

```ts
import { container } from "../ecosystem";

describe("PostService", () => {
  test("approvePost", () => {
    const postService = container.get(PostService);
    // Now you have full access to container and the bundles and other services to provide an integration test
  });
});
```

We typically store out tests inside `src/__tests__/*.test.ts`, and we try to maintain a similar pattern to what we have in our `services` folder, example: `src/__tests__/services/payments/PaymentCheckService.test.ts`.

## Environment Variables

Our solution to this is to use `dotenv` npm package and craft our own `env.ts` file which exports a type-safe constant.

```bash title=".env.development"
APP_URL="http://localhost:3000"
ROOT_URL="http://localhost:4000"
ROOT_PORT=4000
MONGO_URL="mongodb://localhost:27017/bluelibs"

AWS_ACCESS_KEY_ID=XXX
AWS_SECRET_ACCESS_KEY=XXX
AWS_BUCKET=testing.cultofcoders.com
AWS_REGION=eu-central-1
AWS_ENDPOINT=https://s3-eu-central-1.amazonaws.com/testing.cultofcoders.com
```

```ts
import { config } from "dotenv";
import * as fs from "fs";

const path = ".env.development"; // it's up to you to manipulate this variable

// Silently fail when there's no path existence (variables)
// Sometimes the container in which you are deploying has its own ENV mechanisms so no .env file required
if (fs.existsSync(path)) {
  const result = config({
    path,
  });

  if (result.error) {
    console.error(result.error);
    process.exit(0);
  }
} else {
  console.warn(`There is no "${path}" enviornment variable file.`);
}

// Export the values to their correct type
export default {
  APP_URL: process.env.APP_URL,
  ROOT_URL: process.env.ROOT_URL,

  // Sometimes "PORT" is a standard env variable when deploying node apps
  ROOT_PORT: parseInt(process.env.PORT || process.env.ROOT_PORT),
  MONGO_URL: process.env.MONGO_URL,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_BUCKET: process.env.AWS_BUCKET,
  AWS_REGION: process.env.AWS_REGION,
  AWS_ENDPOINT: process.env.AWS_ENDPOINT,
};
```

## Meta

### Summary

These set of tools: the `kernel`, the `container`, the `bundles` (extendable & hackable), the async event management, the type-safe exceptions allow us to construct high-quality applications which respect the SOLID principles and can be nicely re-used. A good example of how this is put to good use is inside the [X-Framework](x-framework-introduction) where we have a cohesive full-stack solution for delivering apps fast and properly decoupled

### Boilerplates

- [The Kernel and a Bundle](https://stackblitz.com/edit/typescript-mhek88?file=index.ts)
- [Event Management Starter](https://stackblitz.com/edit/typescript-jg9osn?file=index.ts)

### Challenges

- What is a Service? (1p)
- What are the main stages of the Bundle's lifecycle? (1p)
- Why do we use Dependency Injection? (1p)
- What is the difference between `prepare()` and `init()` in a bundle? (3p)
- When do we create a new bundle for our application? (5p)
- What are the advantages of async event processing vs sync ones? (2p)
- What does it mean to warm up a service and when would we use it? (1p)
- Can I specify the order in which event listeners are executed? (3p)
