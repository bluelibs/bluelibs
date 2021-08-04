import { Kernel } from "@bluelibs/core";
import { XUIBundle } from "../..";
import fetch from "cross-fetch";
import { HttpLink } from "@apollo/client/core";

export function createSampleKernel() {
  return new Kernel({
    bundles: [
      new XUIBundle({
        graphql: {
          uri: "http://localhost:4000/graphql",
          link: new HttpLink({
            fetch,
          }),
        },
      }),
    ],
  });
}

export function createSampleApolloEcosystem() {}
