/**
 * We customize the Guardian mostly because we have different models of Users, we fetch different data from server than the default and we
 * register them in different ways.
 *
 * Use the `useAppGuardian()` function instead of `useGuardian()`
 */
import {
  GuardianSmart,
  GuardianUserType,
  GuardianUserRegistrationType,
  use,
} from "@bluelibs/x-ui";
import { gql } from "@apollo/client";

type AppUserType = GuardianUserType & {
  fullName: string;
};

type AppRegisterType = GuardianUserRegistrationType;

export class AppGuardian extends GuardianSmart<AppUserType, AppRegisterType> {
  protected retrieveUser(): Promise<AppUserType> {
    return this.apolloClient
      .query({
        query: gql`
          query me {
            me {
              _id
              email
              profile {
                firstName
                lastName
              }
              fullName
              roles
            }
          }
        `,
        fetchPolicy: "network-only",
      })
      .then((response) => {
        return response.data.me;
      });
  }
}

/**
 * Use this instead `useGuardian()`
 * @returns
 */
export function useAppGuardian(): AppGuardian {
  return use(AppGuardian);
}
