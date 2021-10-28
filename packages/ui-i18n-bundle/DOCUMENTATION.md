This is used to detect the userId based on the authentication token and inject it inside the GraphQL's context. On top of that it offers a seamless integration with `Passport` for easy integration with different auth providers

## Install

```bash
npm i -S @bluelibs/apollo-bundle @bluelibs/apollo-security-bundle passport
```

```typescript
import { ApolloSecurityBundle } from "@bluelibs/apollo-security-bundle";

kernel.addBundle(new ApolloSecurityBundle());
```

Options:

```js
export interface IApolloSecurityBundleConfig {
  // All true by default
  support: {
    headers?: boolean,
    cookies?: boolean,
    websocket?: boolean,
  };
  // bluelibs-token is the default for all
  identifiers: {
    headers?: string, // Has priority over cookies
    cookies?: string, // If no header is present it will read from here
    // For websocket you have to send the connection params in order to work
    websocket?: string,
  };
}
```

## Context

`IGraphQLContext` is properly extended by this package:

```js
import { IResolverMap } from "@bluelibs/graphql-bundle";

load({
  resolvers: {
    Query: {
      findMyPosts(_, args, context) {
        // Context should have authenticationToken and userId
        if (!context.userId) {
          // You can throw an error.
        }
      },
    } as IResolverMap,
  },
});
```

## Passport

Benefit of over 500+ authentication strategies, by offering plug-in support for most popular library: [passport](http://www.passportjs.org/)

```bash
npm i -S passport passport-facebook
```

### Authenticator

We define our methods of authentication through `Authenticator` classes. Read through it as the comments will explain the behavior.

```ts title="services/authenticators/FacebookAuthenticator.ts"
import * as passport from "passport";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { ApolloPassportStrategy } from "../models/ApolloPassportStrategy";

export class FacebookAuthenticator extends PassportAuthenticator {
  createStrategy() {
    // This is documented in the passport-facebook package: http://www.passportjs.org/docs/facebook/
    return new FacebookStrategy(
      {
        // Read this either from process.env or inject them inside the classes
        clientID: "XXX",
        clientSecret: "XXX",
        callbackURL: "http://localhost:4000/auth/facebook/callback",
      },
      async (accesstoken, refreshToken, profile, done) => {
        try {
          // If the user is newly created, `isNew` will be true, so you can adapt the profile
          const { isNew, user } = await this.findOrCreate(profile.id);

          // By default we store the "profile.id" inside "facebookId" at user level which is derived from strategy name
          // You can customise the name by overriding get name()

          if (isNew) {
            this.securityService.updateUser(user._id, {
              // other things
            });
          }

          done(null, user);
        } catch (err) {
          done(err);
        }
      }
    );
  }

  route() {
    // This will redirect to facebook to ask for permissions
    // this.app is an express application
    this.app.get("/auth/facebook", passport.authenticate(this.name));

    // This is a helper function to allow easy handle of success
    this.get(
      "/auth/facebook/callback",
      {},
      async (err, user, req, res, next) => {
        // this creates the authentication token for the user
        const token = await this.getToken(user._id);

        res.redirect(`https://uihost.com/facebook/success?token={token}`);
      }
    );
  }
}
```

Note, if you are using `X-Framework`, you can inject the AppRouter which generates urls for the app:

```ts
import { APP_ROUTER, Router } from "@bluelibs/x-bundle";

class FacebookAuthenticator extends PassportAuthenticator {
  @Inject(APP_ROUTER)
  router: Router;

  function getRedirectURL(token: string) {
    return this.router.path("/facebook/success/:token", {
      token
    });
  }
}
```

```ts
// register it inside the passport service
class AppBundle extends Bundle {
  async init() {
    const passportService = this.container.get(PassportService);
    passportService.register(FacebookAuthenticator);
  }
}
```

### Token Security

By using `getToken()` we create an actual token for authentication for the user. The problem is that when we pass that to the `ui` microservice, the url can be sniffed, leading to a security whole in the system.

The solution is that once you arrive at that specific url call the mutation `reissueToken(token)` which will return instead a newly freshly created token that you can store in `localStorage` or where you prefer.
