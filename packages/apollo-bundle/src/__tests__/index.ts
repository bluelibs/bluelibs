import { Kernel, Bundle, ContainerInstance } from "@bluelibs/core";
import { ApolloBundle } from "../ApolloBundle";
import { Loader } from "@bluelibs/graphql-bundle";
import createApolloClient from "./apolloClientCreator";
import { gql } from "@apollo/client";
import { assert } from "chai";
import { PubSub } from "graphql-subscriptions";
import { LoggerBundle } from "@bluelibs/logger-bundle";
Object.assign(global, { WebSocket: require("ws") });
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
      new LoggerBundle({
        console: true,
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
      try {
        await currentKernel.shutdown();
      } catch (e) {
        console.error(e);
        throw e;
      }
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
    try {
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

      await new Promise<void>((resolve) => {
        const subscription = observable.subscribe({
          next(result) {
            const {
              data: { postAdded },
            } = result;
            assert.equal(MESSAGE, postAdded);
            subscription.unsubscribe();
            resolve();
          },
        });

        // So, apparently, it takes some time to .subscribe()
        // And there is no way to wait until the subscription has been initialised
        // This is a bit, strange that there is no way to tell that the subscription has been initialised yet
        // Hopefully in the future we'll have a way to say subscription is ready and we're on standby to receive events
        setTimeout(() => {
          pubsub.publish(CHANNEL, MESSAGE);
        }, 300);
      });
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  it("Should work with middleware from express", async () => {
    let inMiddleware = false;

    const kernel = await createEcosystemWithInit(
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
        enableSubscriptions: false,
        middlewares: [
          (req, res, next) => {
            inMiddleware = true;
            next();
          },
        ],
      }
    );

    const client = createApolloClient(6000);

    const result = await client.query({
      query: gql`
        query {
          something
        }
      `,
    });

    expect(inMiddleware).toBe(true);
  });

  it("Should be able to access the container from within", async () => {
    return new Promise<void>((resolve, reject) => {
      createEcosystemWithInit({
        typeDefs: `
            type Query { something: String }
          `,
        resolvers: {
          Query: {
            something: (_, args, ctx) => {
              try {
                assert.instanceOf(ctx.container, ContainerInstance);
              } catch (e) {
                reject(e);
              }
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

  it("Should print the exception nicely", async () => {
    return new Promise<void>((resolve, reject) => {
      createEcosystemWithInit({
        typeDefs: `
            type Query { something: String }
          `,
        resolvers: {
          Query: {
            something: (_, args, ctx) => {
              // emulate some function calls so we have some stack traces.
              const a = () => {
                const b = () => {
                  const c = () => {
                    // this is the error we want to throw
                    throw new Error(
                      "TEST ERROR - ALL IS GOOD, THIS IS JUST A TEST. DO NOT PANIC. THIS IS ONLY A TEST. PLEASE DO NOT PANIC."
                    );
                  };
                  c();
                };
                b();
              };
              a();
            },
          },
        },
      }).then((kernel) => {
        const client = createApolloClient(6000);

        client
          .query({
            query: gql`
              query {
                something
              }
            `,
          })
          .catch((e) => {
            resolve();
          });
      });
    });
  });
});
