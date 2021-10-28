import { ApolloClient } from "..";
import { container } from "./ecosystem";

describe("UIApolloBundle", () => {
  test("Container Injection", async () => {
    const apolloClient = container.get(ApolloClient);

    expect(apolloClient).toBeTruthy();
  });
});
