import { ApolloBundle } from "@bluelibs/apollo-bundle";
import { Kernel } from "@bluelibs/core";
import { SecurityBundle } from "@bluelibs/security-bundle";
import { ApolloSecurityBundle } from "../ApolloSecurityBundle";

export function createKernel() {
  return new Kernel({
    bundles: [
      new ApolloBundle({
        port: 6400,
      }),
      new ApolloSecurityBundle(),
      // Disable the session cleanup interval so jest can exit after the test.
      new SecurityBundle({ session: { cleanup: false } }),
    ],
  });
}
