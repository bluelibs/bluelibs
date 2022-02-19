We use `Guardian` for authentication & authorisation. The logic is built around a [smart](/docs/package-smart) class which communicates with the server via GraphQL, providing authentication methods for `register`, `login`, `logout`, `changePassword`, `forgotPassword`, `resetPassword` or `verifyEmail`.

The guardian is designed to be compatible with [XAuthBundle](/docs/package-x-auth-bundle) on the server.

It also handles fetching the user data using the `me` standard query, but this behavior can be later changed.

## Install

```bash
npm i -S @bluelibs/x-ui-guardian-bundle @bluelibs/ui-apollo-bundle @bluelibs/x-ui-react-bundle
```

```tsx
import { Kernel } from "@bluelibs/core";
import { UIApolloBundle } from "@bluelibs/ui-apollo-bundle";
import { XUIReactBundle } from "@bluelibs/x-ui-react-bundle";
import { XUIGuardianBundle } from "@bluelibs/x-ui-guardian-bundle";

const kernel = new Kernel({
  bundles: [
    new UIApolloBundle(),
    new XUIReactBundle(),
    new XUIGuardianBundle(),
  ],
});
```

## Usage

```tsx
import { useGuardian } from "@bluelibs/x-ui-guardian-bundle";

function Component() {
  const guardian = useGuardian();

  // Work with it via event handlers, ofcourse:
  guardian
    .login("username", "password")
    .then((result) => {
      // Handle
    })
    .catch((err) => {
      // Handle
    });
}
```

Beside logging in you can do a lot of cool things:

```ts
guardian.register({});
guardian.logout();

guardian.forgotPassword("EMAIL_ADDRESS"); // sends email if it exists, does not expose
// the username is optional
guardian.resetPassword(username, token, newPassword); // the token received by email from forgot pass
guardian.verifyEmail("EMAIL_TOKEN"); // verifies your email address so it marks it in the database
guardian.changePassword(oldPassword, newPassword); // changes your pw
```

Let's use guardian in our components:

```tsx
function TopBar() {
  const guardian = useGuardian();

  const {
    // This happens on first page load, if the Guardian has finished reading the token and fetching the user (if exists)
    initialised,
    isLoggedIn,
    // This happens when Guardian initialises and the stored token has expired and can no longer be used
    hasInvalidToken,
    // This is true after logging in, or when initialising we fetch the user via me() query
    // This gets false after the me() query has returned or errored
    fetchingUserData,
    user,
  } = guardian.state;

  // In this realm the component will re-render automatically if the user logs in, just use the variables from state.

  // it checks for roles: []
  const isAdmin = guardian.hasRole(Roles.ADMIN);
}
```

The user type is the default one from `XAuthBundle`:

```ts
type GuardianUserType = {
  _id: string | object | number;
  profile: {
    firstName: string;
    lastName: string;
  };
  roles: string[];
  email: string;
};
```

## Extending the Guardian

There are several reasons you would want to extend the guardian, most popular being

1. Change registration input
2. Fetch different set of data of the logged in user

```ts
import {
  GuardianSmart,
  GuardianUserType,
  GuardianUserRegistrationType,
} from "@bluelibs/x-ui-guardian-bundle";

// configure your types, optionally extend the default guardian user types we imported
type AppUserType = GuardianUserType & {
  profile: {
    fullName: string;
    gamerScore: number;
  };
};

class AppGuardianSmart extends GuardianSmart<AppUserType> {
  retrieveUser(): Promise<AppUserType> {
    // you have access to this.authenticationToken
    return this.apolloClient
      .query({
        // custom query
        fullName: 1,
        gamerScore: 1,
      })
      .then((response) => {
        return response.data.me;
      });
  }
}
```

We specify this class when we initialise `XUIBundle()`:

```tsx
new XUIGuardianBundle({
  guardianClass: AppGuardianSmart,
});
```

And voila!

The `register` calls the `registration` mutation with the GraphQL input: `RegistrationInput`. It's enough to change the input on the server-side by overriding `registration` mutation in [XAuthBundle](/docs/package-x-auth-bundle).

However if you want to extend the interface of `Guardian`, meaning you add other methods or add other variables to the existing methods, then besides overriding the `guardianClass` you need to create your own hook, to benefit of autocompletion.

```tsx
const useAppGuardian = (): AppGuardianSmart => {
  return useGuardian() as AppGuardianSmart;
};
```

## Events

| Event                      | What                                                                                                   | Props                |
| -------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------- |
| GuardianUserRetrievedEvent | After the user is fetched from the API we launch this event giving you a chance to do other operations | data.user : UserType |
