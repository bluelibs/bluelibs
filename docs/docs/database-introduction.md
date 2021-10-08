---
id: database-introduction
title: Introduction to Databases
---

This chapter is focused on helping you understand how we treat databases when we're dealing with the core. As you know, the core is fully decoupled and can be made to work with any database with a node driver.

The database can be anything, it can be a REST API, MongoDB, MySQL, Redis. Anything that interacts with a system that reads or mutates data is considered a database.

If we would like to connect to a database, first we would need to create a bundle for it. Let's invent a new database: "Lingua".

You can [find the code here](https://stackblitz.com/edit/typescript-irxdzi?file=index.ts)

```ts
import { Kernel, Service, Bundle } from "@bluelibs/core";

@Service()
class LinguaService {
  // (Lingua isn't a very smart database)
  store: any = {};

  async set(key: string, value: any) {
    this.store[key] = value;
  }

  async get(key: string) {
    return this.store[key];
  }
}
x;

class LinguaBundle extends Bundle {
  async init() {
    // Reminder: this just instantiates the service and optionally calls `init()` if it exists
    this.warmup([LinguaService]);
  }
}

const kernel = new Kernel({
  bundles: [new LinguaBundle()],
});

kernel.init().then(async () => {
  // This is just for illustration, you would for sure use this in another service or bundle not here.
  const linguaService = kernel.container.get(LinguaService);

  linguaService.set("numberOfDonuts", 49501);
  linguaService.get("numberOfDonuts"); // 49501
});
```

If you would like to integrate with any database, you can expose the service. But let's say `Lingua` is more than that, it just doesn't have `.set()` and `.get()` globally, it has dedicated collections, which have a certain model:

```ts
class User {
  name: string;
  age: number;
}

@Service()
class UsersCollection extends LinguaCollection<User> {
  getCollectionName() {
    return "users";
  }
}
```

To implement such a thing we need to create this class collection and make it interract with the main `LinguaService`:

```ts
// It's abstract because we don't allow it to initialise on its own
@Service()
abstract class LinguaCollection<T = any> {
  @Inject(() => LinguaService)
  protected lingua: LinguaService;

  async set(key: string, value: T) {
    key = this.getCollectionName() + ":" + key; // 'users:1' if key is '1'
    await this.lingua.set(key, value);
  }

  async get(key: string): Promise<T> {
    key = this.getCollectionName() + ":" + key; // 'users:1' if key is '1'
    return this.lingua.get(key);
  }

  // `abstract` forces other classes that extend this class to implement it
  abstract getCollectionName(): string;
}
```

Now you would use your database properly via:

```typescript
const usersCollection = container.get(UsersCollection);

await usersCollection.set("1", { name: "John", age: 123 }); // autocompletion
const user = await usersCollection.get("1"); // typed to "User"
```

This is like the "basics" of the "basics" of implementing a database interaction layer. There are many ways to continue, questions like these arise:

- What if I want validation? How would I add it?
- Can I have database event hooks? (before inserting, after, etc)
- What if I need a specific schema to match the database type? (SQL).
- Database migrations (how do we handle the fact a change has happened in the database)
- Repetitive behaviors such as adding timestampable (createdAt, updatedAt)?

It is a long story to go through each, we just want to open you to the possibilities. We have 2 approaches that cover a lot of applications:

1. [MongoBundle](package-mongo) that integrates with MongoDB (ofcourse), [Nova](package-nova) and has lots of goodies.
2. Integration with [MikroORM 4](https://mikro-orm.io/docs/installation/) which has a healthy approach towards SQL databases.
