import { ApolloBundle } from "@bluelibs/apollo-bundle";
import { ContainerInstance, Kernel } from "@bluelibs/core";
import { PostsCollection } from "./collections";
import { createEcosystem } from "./createEcosystem";
import { SubscriptionStore } from "../../services/SubscriptionStore";
import { DatabaseService } from "@bluelibs/mongo-bundle";

let container: ContainerInstance;

beforeAll(async () => {
  container = await createEcosystem();
});

beforeEach(async () => {
  const postsCollection = container.get(PostsCollection);
  await postsCollection.deleteMany({});
});

afterAll(async () => {
  if (container) {
    const kernel = container.get(Kernel);
    const currentServer = container.get(ApolloBundle).httpServer;
    const dbService = container.get(DatabaseService);

    // await dbService.client.close();
    await currentServer.close();
  }
});

test("Should work with default strategy", async () => {
  const postsCollection = container.get(PostsCollection);
  const result = await postsCollection.insertOne({
    title: "Hello",
    ok: true,
  });

  const subscriptionStore = container.get(SubscriptionStore);
  let inAdded = false;
  const subscription = await subscriptionStore.createSubscription(
    postsCollection,
    {
      $: {
        filters: {
          ok: true,
        },
      },
      title: 1,
      _id: 1,
    },
    {
      onAdded(document) {
        inAdded = true;
      },
    }
  );

  await subscription.ready();

  expect(inAdded).toBe(true);

  await subscription.stop();
});

test("Should work with direct-id strategy", async () => {
  const postsCollection = container.get(PostsCollection);
  const result = await postsCollection.insertOne({
    title: "Hello",
    ok: true,
  });

  const subscriptionStore = container.get(SubscriptionStore);
  let inAdded = false;
  const subscription = await subscriptionStore.createSubscription(
    postsCollection,
    {
      $: {
        filters: {
          _id: result.insertedId,
        },
      },
      title: 1,
      _id: 1,
    },
    {
      onAdded(document) {
        inAdded = true;
      },
    }
  );

  await subscription.ready();
  expect(inAdded).toBe(true);

  await subscription.stop();
});

test("Should work with limit-sort strategy", async () => {
  const postsCollection = container.get(PostsCollection);
  const result = await postsCollection.insertOne({
    title: "Hello",
    ok: true,
  });

  const subscriptionStore = container.get(SubscriptionStore);
  let inAdded = false;
  const subscription = await subscriptionStore.createSubscription(
    postsCollection,
    {
      $: {
        filters: {
          _id: result.insertedId,
        },
        options: {
          sort: { title: 1 },
          limit: 5,
        },
      },
      title: 1,
      _id: 1,
    },
    {
      onAdded(document) {
        inAdded = true;
      },
    }
  );

  await subscription.ready();
  expect(inAdded).toBe(true);

  await subscription.stop();
});

test("Test changes are detected for top-fields", async (done) => {
  const postsCollection = container.get(PostsCollection);
  const result = await postsCollection.insertOne({
    title: "Hello",
    ok: true,
  });

  const subscriptionStore = container.get(SubscriptionStore);
  const subscription = await subscriptionStore.createSubscription(
    postsCollection,
    {
      $: {
        filters: {
          ok: true,
        },
      },
      _id: 1,
      title: 1,
    },
    {
      onChanged(documentId, set) {
        expect(set.title).toBe("Goodbye");
        subscription.stop();
        done();
      },
    }
  );

  postsCollection.updateOne(
    { _id: result.insertedId },
    {
      $set: {
        title: "Goodbye",
      },
    }
  );
});

test("Test changes are detected for nested fields also", async (done) => {
  const postsCollection = container.get(PostsCollection);
  const result = await postsCollection.insertOne({
    ok: true,
    profile: {
      name: "123",
      age: 123,
    },
  });

  const subscriptionStore = container.get(SubscriptionStore);
  const subscription = await subscriptionStore.createSubscription(
    postsCollection,
    {
      $: {
        filters: {
          ok: true,
        },
      },
      _id: 1,
      profile: 1,
    },
    {
      onChanged(documentId, set) {
        expect(set.profile.age).toBe(99);
        expect(set.profile.name).toBe("123");

        subscription.stop();
        done();
      },
    }
  );

  await postsCollection.updateOne(
    { _id: result.insertedId },
    {
      $set: {
        "profile.age": 99,
      },
    }
  );
});

test("Test whether limit-sort respects the propper 'collection view' after insertion, change, change-non-interesting, removed", async (done) => {
  const postsCollection = container.get(PostsCollection);
  const result1 = await postsCollection.insertOne({
    number: 1,
    initialNumber: 1,
  });
  const result2 = await postsCollection.insertOne({
    number: 2,
    initialNumber: 2,
  });
  const result3 = await postsCollection.insertOne({
    number: 3,
    initialNumber: 3,
  });
  const result4 = await postsCollection.insertOne({
    number: 4,
    initialNumber: 4,
  });
  const result5 = await postsCollection.insertOne({
    number: 5,
    initialNumber: 5,
  });

  const subscriptionStore = container.get(SubscriptionStore);
  const subscription = await subscriptionStore.createSubscription(
    postsCollection,
    {
      $: {
        options: {
          limit: 3,
          sort: {
            number: -1,
          },
        },
      },
      number: 1,
      initialNumber: 1,
    }
  );

  subscription.onRemoved((document) => {
    expect(document._id.toString()).toBe(result5.insertedId.toString());
  });
  subscription.onAdded((document) => {
    expect(document._id.toString()).toBe(result2.insertedId.toString());
    subscription.stop();
    done();
  });

  await postsCollection.updateOne(
    { _id: result5.insertedId },
    {
      $set: {
        number: 0,
      },
    }
  );
});

test("Ensure that if you're following certain fields and I change another field I will not be notified", async (done) => {
  const postsCollection = container.get(PostsCollection);
  const context = Math.random();
  const result = await postsCollection.insertOne({
    title: "Hello",
    context,
  });

  const subscriptionStore = container.get(SubscriptionStore);
  const subscription = await subscriptionStore.createSubscription(
    postsCollection,
    {
      $: {
        filters: {
          context,
        },
      },
      _id: 1,
      title: 1,
    },
    {
      onChanged(document, set) {
        done("Should not be triggered");
        subscription.stop();
      },
    }
  );

  postsCollection.updateOne(
    { _id: result.insertedId },
    {
      $set: {
        name: "JOJOBA",
      },
    }
  );

  done();
});

test("Check update with positional property", async (done) => {
  const postsCollection = container.get(PostsCollection);
  const result = await postsCollection.insertOne({
    title: "Hello",
    bom: [
      {
        stockId: 1,
        quantity: 1,
      },
      {
        stockId: 2,
        quantity: 2,
      },
      {
        stockId: 3,
        quantity: 3,
      },
    ],
  });

  const subscriptionStore = container.get(SubscriptionStore);
  const subscription = await subscriptionStore.createSubscription(
    postsCollection,
    {
      _id: 1,
      title: 1,
      bom: 1,
    },
    {
      onChanged(document, set) {
        expect(document._id.toString()).toBe(result.insertedId.toString());
        document.bom.forEach((element) => {
          expect(Object.keys(element).length).toBe(2);
          if (element.stockId === 1) {
            expect(element.quantity).toBe(30);
          } else {
            expect(element.quantity).toBe(element.stockId);
          }
        });
        subscription.stop();
        done();
      },
    }
  );

  postsCollection.updateOne(
    { _id: result.insertedId, "bom.stockId": 1 },
    {
      $set: { "bom.$.quantity": 30 },
    }
  );
});

test("Should be able to skip live changes", async (done) => {
  const postsCollection = container.get(PostsCollection);
  const context = Math.random();
  const result = await postsCollection.insertOne({
    title: "Hello",
    context,
  });

  const subscriptionStore = container.get(SubscriptionStore);
  const subscription = await subscriptionStore.createSubscription(
    postsCollection,
    {
      $: {
        filters: {
          context,
        },
      },
      title: 1,
      _id: 1,
    },
    {
      onChanged(document) {
        done("Should not be triggered");
        subscription.stop();
      },
    }
  );

  postsCollection.updateOne(
    { _id: result.insertedId },
    {
      $set: { title: "Goodbye" },
    },
    {
      context: {
        live: {
          disable: true,
        },
      },
    }
  );

  done();
});

test("Ensure multi-update multi-removed are detected properly", async (done) => {
  const postsCollection = container.get(PostsCollection);
  const context = Math.random();
  const result = await postsCollection.insertOne({
    title: "Hello",
    context,
  });

  const subscriptionStore = container.get(SubscriptionStore);
  const subscription = await subscriptionStore.createSubscription(
    postsCollection,
    {
      $: {
        filters: {
          context,
        },
      },
      title: 1,
      _id: 1,
    },
    {
      onChanged(document, set) {
        expect(set.title).toBe("Goodbye");
        subscription.stop();
        done();
      },
    }
  );

  postsCollection.updateMany(
    {
      context,
    },
    {
      $set: { title: "Goodbye" },
    }
  );
});

// If you specify the field "profile.name", and what changes is "profile.age", we shouldn't receive a changed event

// Should work with direct-ids processing and other filters present

// When you have filter on a subfield, and the topper field is in its "fields", it should trigger change

// Test that it works with redis

// Ensure subscriptions are closed. Queues are no longer actives.
