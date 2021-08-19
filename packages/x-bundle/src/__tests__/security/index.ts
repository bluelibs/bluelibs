import { createEcosystem } from "./setup/createEcosystem";
import { createClient, authStorage } from "./setup/client";
import { ContainerInstance, Kernel } from "@bluelibs/core";
import { ApolloClient, gql } from "@apollo/client";

describe("Security tests", () => {
  let container: ContainerInstance;
  let client: ApolloClient<any>;

  async function login(username, password): Promise<string> {
    const response = await client.mutate({
      mutation: gql`
        mutation login($input: LoginInput!) {
          login(input: $input) {
            token
          }
        }
      `,
      variables: {
        input: {
          username,
          password,
        },
      },
    });

    authStorage.value = response.data.login.token;
    return response.data.login.token;
  }

  beforeAll(async () => {
    container = await createEcosystem();
    client = createClient();
  });

  afterAll(async () => {
    await container.get(Kernel).shutdown();
  });

  test("Should allow me as an admin", async () => {
    await login("admin@bluelibs.com", "12345");

    const result = await client.query({
      query: gql`
        query PostsFind {
          PostsFind {
            title
            description
            private
            adminOnlyField
          }
        }
      `,
    });

    const data = result.data.PostsFind;

    expect(data).toHaveLength(3);
    data.forEach((element) => {
      expect(typeof element.private === "boolean").toBe(true);
    });
  });

  test("Should allow me as a project manger but not expose private docs", async () => {
    await login("project-manager@bluelibs.com", "12345");

    const result = await client.query({
      query: gql`
        query PostsFind {
          PostsFind {
            title
            description
            private
          }
        }
      `,
    });

    const data = result.data.PostsFind;

    expect(data).toHaveLength(2);
    data.forEach((element) => {
      expect(element.private).toBe(false);
    });
  });

  test("Should throw error when requesting a non-allowed field", async () => {
    await login("project-manager@bluelibs.com", "12345");

    const result = await client
      .query({
        query: gql`
          query PostsFind {
            PostsFind {
              title
              description
              private
              adminOnlyField
            }
          }
        `,
      })
      .catch((err) => {
        expect(JSON.stringify(err)).toContain(`adminOnlyField`);
      });

    expect(result).toBeUndefined();
  });

  test("Should throw an error if I'm not logged in and I want to fetch data", async () => {
    authStorage.value = undefined;

    const result = await client
      .query({
        query: gql`
          query PostsFind {
            PostsFind {
              title
              description
              private
              adminOnlyField
            }
          }
        `,
      })
      .catch((err) => {
        expect(JSON.stringify(err)).toContain("No matching security rule");
      });

    expect(result).toBeUndefined();
  });

  test("Should allow me as a project manager to update my projects only", async () => {
    await login("project-manager@bluelibs.com", "12345");

    const mutationDefinition = (_id) => ({
      mutation: gql`
        mutation UpdateProject($_id: String!, $document: EJSON!) {
          PostsUpdateOne(_id: $_id, document: $document) {
            title
          }
        }
      `,
      variables: {
        _id,
        document: {
          title: "New Custom Title",
        },
      },
    });

    const response = await client.mutate(mutationDefinition("pm_1"));

    expect(response.data.PostsUpdateOne.title).toBe("New Custom Title");
    const response3 = await client
      .mutate(mutationDefinition("pm_2"))
      .catch((err) => {
        expect(JSON.stringify(err)).toContain("The ownership of the document");
      });

    expect(response3).toBeUndefined();

    // sanity check unlogged in
    authStorage.value = undefined;

    const response2 = await client
      .mutate(mutationDefinition("pm_1"))
      .catch((err) => {
        expect(JSON.stringify(err)).toContain("USER_NOT_AUTHORIZED");
      });

    expect(response2).toBeUndefined();
  });
});
