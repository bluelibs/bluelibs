import { Kernel, Bundle, ContainerInstance } from "@bluelibs/core";
import { ApolloBundle } from "../ApolloBundle";
import { Loader } from "@bluelibs/graphql-bundle";
import createApolloClient from "./apolloClientCreator";
import { gql } from "apollo-boost";
import { assert } from "chai";
import { PubSub } from "graphql-subscriptions";

let currentKernel;

async function createEcosystemWithInit(
  loadable: any,
  otherOptions: any = {}
): Promise<Kernel> {
  class MyBundle extends Bundle {
    async init() {
      this.get<Loader>(Loader).load(loadable);
    }
  }

  const kernel = new Kernel({
    bundles: [
      new ApolloBundle({
        port: 6000,
        enableSubscriptions: true,
        ...otherOptions,
      }),
      new MyBundle(),
    ],
  });

  await kernel.init();

  currentKernel = kernel;

  return kernel;
}

describe("ApolloBundle", () => {
  afterEach(async () => {
    if (currentKernel) {
      await currentKernel.shutdown();
    }
  });

  it("Should be able to initialise the server", async () => {
    const kernel = await createEcosystemWithInit({
      typeDefs: `
          type Query {
            sayHello: String
          }
        `,
      resolvers: {
        Query: {
          sayHello: () => "Hello world!",
        },
      },
    });

    const client = createApolloClient(6000);

    const result = await client.query({
      query: gql`
        query {
          sayHello
        }
      `,
    });

    assert.isObject(result.data);
    assert.equal("Hello world!", result.data.sayHello);
  });

  it("Should ensure that subscriptions work properly", async () => {
    const pubsub = new PubSub();
    const CHANNEL = "tick";

    const kernel = await createEcosystemWithInit({
      typeDefs: `
        type Query {
          framework: String
        }
        type Subscription {
          postAdded: String
        }
      `,
      resolvers: {
        Query: {
          framework: () => "BlueLibs",
        },
        Subscription: {
          postAdded: {
            // Additional event labels can be passed to asyncIterator creation
            subscribe: () => {
              const iterator = pubsub.asyncIterator([CHANNEL]);

              return iterator;
            },
            resolve: (payload) => {
              return payload;
            },
          },
        },
      },
    });

    const client = createApolloClient(6000);

    const observable = client.subscribe({
      query: gql`
        subscription postAdded {
          postAdded
        }
      `,
    });

    const MESSAGE = "1,2,3";

    return new Promise<void>((resolve) => {
      observable.subscribe({
        next(result) {
          const {
            data: { postAdded },
          } = result;
          assert.equal(MESSAGE, postAdded);
          resolve();
        },
      });

      // So, apparently, it takes some time to .subscribe()
      // And there is no way to wait until the subscription has been initialised
      // This is a bit, strange that there is no way to tell that the subscription has been initialised yet
      // Hopefully in the future we'll have a way to say subscription is ready and we're on standby to receive events
      setTimeout(() => {
        pubsub.publish(CHANNEL, MESSAGE);
      }, 100);
    });
  });

  it("Should work with middleware from express", async () => {
    return new Promise<void>((resolve) => {
      createEcosystemWithInit(
        {
          typeDefs: `
            type Query { something: String }
          `,
          resolvers: {
            Query: {
              something: () => "Hello world!",
            },
          },
        },
        {
          middlewares: [
            (req, res, next) => {
              resolve();
            },
          ],
        }
      ).then((kernel) => {
        const client = createApolloClient(6000);

        client.query({
          query: gql`
            query {
              something
            }
          `,
        });
      });
    });
  });

  it("Should be able to access the container from within", async () => {
    return new Promise<void>((resolve) => {
      createEcosystemWithInit({
        typeDefs: `
            type Query { something: String }
          `,
        resolvers: {
          Query: {
            something: (_, args, ctx) => {
              assert.instanceOf(ctx.container, ContainerInstance);
              resolve();
            },
          },
        },
      }).then((kernel) => {
        const client = createApolloClient(6000);

        client.query({
          query: gql`
            query {
              something
            }
          `,
        });
      });
    });
  });
});
