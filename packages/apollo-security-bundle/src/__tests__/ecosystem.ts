import { ApolloBundle } from "@bluelibs/apollo-bundle";
import { Kernel } from "@bluelibs/core";
import { SecurityBundle } from "@bluelibs/security-bundle";
import { ApolloSecurityBundle } from "../ApolloSecurityBundle";

export function createKernel() {
  return new Kernel({
    bundles: [
      new ApolloBundle({
        port: 5000,
      }),
      new ApolloSecurityBundle(),
      new SecurityBundle(),
    ],
  });
}
