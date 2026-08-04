import { Kernel, Bundle, ContainerInstance } from "@bluelibs/core";
import { ApolloBundle } from "../ApolloBundle";
import { Loader } from "@bluelibs/graphql-bundle";
import createApolloClient from "./apolloClientCreator";
import { gql } from "@apollo/client";
import { assert } from "chai";
import { PubSub } from "graphql-subscriptions";
import { LoggerBundle } from "@bluelibs/logger-bundle";
import fetch from "isomorphic-fetch";
Object.assign(global, { WebSocket: require("ws") });
let currentKernel: Kernel;

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
    await createEcosystemWithInit({
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

      await createEcosystemWithInit({
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
              resolve: (payload: any) => {
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

    await createEcosystemWithInit(
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
          (_req: any, _res: any, next: any) => {
            inMiddleware = true;
            next();
          },
        ],
      }
    );

    const client = createApolloClient(6000);

    await client.query({
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
            something: (_: any, _args: any, ctx: any) => {
              try {
                assert.instanceOf(ctx.container, ContainerInstance);
              } catch (e) {
                reject(e);
              }
              resolve();
            },
          },
        },
      }).then(() => {
        const client = createApolloClient(6000);

        // The first connection right after the previous test's server is
        // torn down on the same port can be reset (ECONNRESET), so retry.
        const run = (attemptsLeft = 3) => {
          client
            .query({
              query: gql`
                query {
                  something
                }
              `,
            })
            .catch((error) => {
              if (attemptsLeft > 0)
                setTimeout(() => run(attemptsLeft - 1), 100);
              else reject(error);
            });
        };

        run();
      });
    });
  });

  it("Should print the exception nicely", async () => {
    return new Promise<void>((resolve) => {
      createEcosystemWithInit({
        typeDefs: `
            type Query { something: String }
          `,
        resolvers: {
          Query: {
            something: () => {
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
      }).then(() => {
        const client = createApolloClient(6000);

        client
          .query({
            query: gql`
              query {
                something
              }
            `,
          })
          .catch(() => {
            resolve();
          });
      });
    });
  });

  it("enforces uploads.maxFileSize/maxFiles configured on the bundle", async () => {
    // The bundle wires its uploads config into graphqlUploadExpress, so a
    // multipart request that exceeds either limit must be rejected before the
    // payload is delivered to a resolver.
    await createEcosystemWithInit(
      {
        typeDefs: `
          type Query { ok: Boolean }
          type Mutation { readFile(file: Upload): Int }
        `,
        resolvers: {
          Mutation: {
            readFile: async (_root: any, args: any) => {
              const file = await args.file;
              const stream = file.createReadStream();
              let size = 0;
              for await (const chunk of stream) {
                size += (chunk as Buffer).length;
              }
              return size;
            },
          },
        },
      },
      {
        enableSubscriptions: false,
        uploads: { maxFileSize: 10, maxFiles: 1 },
      }
    );

    const endpoint = "http://localhost:6000/graphql";
    const operation = JSON.stringify({
      query: "mutation($f: Upload!) { readFile(file: $f) }",
      variables: { f: null },
    });
    const boundary = "TESTBOUNDARY123";

    const sendMultipart = async (
      map: Record<string, string[]>,
      files: { name: string; content: string }[]
    ): Promise<{ status: number; body: string }> => {
      let body = `--${boundary}\r\n`;
      body += `Content-Disposition: form-data; name="operations"\r\n\r\n`;
      body += `${operation}\r\n`;
      body += `--${boundary}\r\n`;
      body += `Content-Disposition: form-data; name="map"\r\n\r\n`;
      body += `${JSON.stringify(map)}\r\n`;
      for (const file of files) {
        body += `--${boundary}\r\n`;
        body += `Content-Disposition: form-data; name="${file.name}"; filename="${file.name}.txt"\r\n`;
        body += `Content-Type: text/plain\r\n\r\n`;
        body += `${file.content}\r\n`;
      }
      body += `--${boundary}--\r\n`;

      // The first connection right after the previous test's server is torn
      // down on the same port can be reset (ECONNRESET), so retry.
      // `apollo-require-preflight` is needed for the request to get past
      // Apollo's CSRF protection once it reaches the GraphQL middleware.
      const run = (
        attemptsLeft = 3
      ): Promise<{ status: number; body: string }> =>
        fetch(endpoint, {
          method: "POST",
          headers: {
            "content-type": `multipart/form-data; boundary=${boundary}`,
            "apollo-require-preflight": "true",
          },
          body,
        })
          .then(async (res) => ({
            status: res.status,
            body: await res.text(),
          }))
          .catch((error) => {
            if (attemptsLeft > 0)
              return new Promise((resolve) =>
                setTimeout(() => resolve(run(attemptsLeft - 1)), 100)
              );
            throw error;
          });

      return run();
    };

    // maxFiles: 1 — declaring two files in the map must be rejected.
    const tooMany = await sendMultipart(
      { "0": ["variables.f"], "1": ["variables.g"] },
      [
        { name: "0", content: "one" },
        { name: "1", content: "two" },
      ]
    );
    expect(tooMany.status).toBe(413);
    expect(tooMany.body).toContain("max file uploads exceeded");

    // maxFileSize: 10 — reading a larger file must fail with the size-limit error.
    const oversized = await sendMultipart({ "0": ["variables.f"] }, [
      { name: "0", content: "x".repeat(1000) },
    ]);
    expect(oversized.body).toContain("exceeds the 10 byte size limit");
  });
});
