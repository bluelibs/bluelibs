This package from X-Framework gives you fully integrated passwords system, with GraphQL endpoints and customisable emails. This bundle makes use of the original `PasswordBundle` to allow-it plug-in into your X-stack.

## Install

```typescript
import { XAuthBundle } from "@bluelibs/x-auth-bundle";

// For this to work you need the following: SecurityBundle, ApolloBundle, ApolloSecurityBundle, SecurityMongoBundle, XBundle

kernel.addBundle(new XAuthBundle());
```

Ensure you have a type user in your graphql, or disable the me query:

```typescript file="graphql/entities/User.graphql.ts"
type User {
  _id: ObjectID!
}
```

```ts
new XAuthBundle({
  graphql: {
    queries: {
      me: false,
    },
  },
});
```

## Emails

We have the following emails setup:

1. `Welcome` once that user has registered
2. `Verify Email` when we want to verify the user's email
3. `Forgot Password` to receive the reset password link on your email
4. `Reset Password Confirmation` after you've reset your password you'll get a confirmation.

All these emails can be overriden like this:

### Customise

```tsx
import { IReactEmailTemplate } from "@bluelibs/email-bundle";
import { IWelcomeEmailProps } from "@bluelibs/x-auth-bundle";

export const CustomWelcomeEmail: IReactEmailTemplate<IWelcomeEmailProps> = (
  props
) => (
  <div>
    <p>Hello {props.name},</p>
    Go here: <a href={props.welcomeUrl}>{props.welcomeUrl}</a>
    <p>
      Regards, <br />
      {props.regardsName}
    </p>
  </div>
);

new XAuthBundle({
  emails: {
    templates: {
      welcome: CustomWelcomeEmail,
      verifyEmail: "...",
      forgotPassword: "...",
      resetPasswordConfirmation: "...",
    },
  },
});
```

## Registration Flow

- User registers with `firstName`, `lastName`, `email` and `password`
- We assume that the username will be the email. This can be customised by you.
- If verify email is enabled, the `VerifyEmail` will be sent (if `sendEmailVerification` )
  - After the email gets verified, the `WelcomeEmail` is sent (if `sendWelcomeEmail` is enabled)
- If verify email is disabled and `sendWelcomeEmail` is enabled, the `WelcomeEmail` will be initially sent.

By default user is able to login without having the email verified. However, using the `emails.requiresEmailVerificationBeforeLoggingIn` config on the bundle, this will not be an option. The `register` will return a null token and user cannot login until his email gets verified.

This is done by playing with `isEnabled` from `IUser` which doesn't allow the user to login.

After email gets verified, `isEnabled` is marked as true.

:::caution
If you later introduce processes of email verification (like when he changes the email, etc) please note that we mark `isEnabled` to true. So if you have suspended the user and somehow he can request an email verification, be careful.
:::

### Urls

You can also modify the paths based on the X-Framework application url:

```ts
new XAuthBundle({
  emails: {
    paths: {
      welcomePath: "/welcome",
      resetPasswordPath: "/reset-password/:token",
      verifyEmailPath: "/verify-email/:token",
    },
  },
});
```

### Other Configuration

```ts
new XAuthBundle({
  emails: {
    applicationName: "My App";
    regardsName: "My App Team";
    // Sometimes the email verification can be the welcome one
    // In that case, don't send an welcome email and customise your email verification one
    sendEmailVerification: true;
    sendWelcomeEmail: true;
  }
  // Don't allow users with email unverified to login:
  requiresEmailVerificationBeforeLoggingIn: false,
})
```

## Mutations

Once you added this bundle, you will see some mutations appearing in your GraphQL docs, these can be toggled on/off using this:

```ts
// The configuration is:
export interface IXAuthBundleConfig {
  graphql: {
    mutations: {
      register: boolean;
      changePassword: boolean;
      login: boolean;
      logout: boolean;
      resetPassword: boolean;
      forgotPassword: boolean;
      verifyEmail: boolean;
    };
  };
}
```

You can also get REST apis versions of those previous mutations, if you toggled on/off the rest attribute :

To use patch/post apis please provide the input types as json body, the inputs for every api can be imported from the bundle as `RegistrationInput,ChangePasswordInput,LoginInput ...`

```ts
// The configuration is:
export interface IXAuthBundleConfig {
  rest: {
    login: true; //post
    logout: true; //post
    register: true; //post
    changePassword: true; //patch
    resetPassword: true; //post
    forgotPassword: true; //post
    verifyEmail: true; //post
    requestLoginLink: true; //post
    verifyMagicCode: true; //post
    me: true; //get
  };
}
```

:::caution
If you are gonna use the rest api, or social auth, you are gonna need to include the `HttpBundle` in your kernel
:::

## Custom Registration

By default registration accepts `firstName`, `lastName`, `email` and `password`. If you have a more complex registration, we recommend disabling `register` mutation as shown above and implement your own:

```graphql
input RegisterInput {
  email: String!
  password: String!
  firstName: String!
  lastName: String!
}

type RegisterResponse {
  token: String
}

type Mutation {
  register(input: RegisterInput!): RegisterResponse
}
```

```ts
import { IGraphQLContext, InputType } from "@bluelibs/graphql-bundle";
import { RegisterInput, XAuthService } from "@bluelibs/x-auth-bundle";

class MyCustomInput extends RegisterInput {
  age: string;
}

function register(_, args: InputType<RegisterInput>, context: IGraphQLContext) {
  const { input } = args;
  const xAuthService = context.container.get(XAuthService);

  const { email, password, firstName, lastName } = input;
  const { userId, token } = xAuthService.register({
    email,
    password,
    firstName,
    lastName,
  });

  // Do additional operations, call another service with the "age" part.
  return {
    token,
  };
}
```

## Magic Link/Code Authentication

We provide in addition to password authentication option, an option to login by sending a magic code/token to the user email :

```ts
// The configuration is:
export interface IXAuthBundleConfig {
  magicCodeLifeDuration: "5m"; //how long the sent code would stay valid
  magicAuthFormat: "code"; // the format of the validation: code (of 6 digits),token
  leftSubmissionsCount: 3; // how many submissions before we blokc the user from using this method
}
```

## Override Logic

You can modify behavior of your mutation resolvers by creating your own `XAuthService`:

```ts
import { RegistrationInput, XAuthService } from "@bluelibs/x-auth-bundle";

class MyXAuthService extends XAuthService {
  register(input: RegistrationInput) {
    // Do your thingie here.
    // Or you can disable the mutation, and simply implement your own.
  }
}

// ...
new XAuthBundle({
  services: {
    XAuthService: MyXAuthService,
  },
});
```

## Multiple Factor Authentication

The multiple factor strategy, is configured based on an array of `factors` that the user with a specific condition need to authorize all of them before gaining access to the app :

```ts
import { PASSWORD_STRATEGY, MAGIC_AUTH_STRATEGY } from "@bluelibs/x-auth-bundle";

// The configuration is:
export interface IXAuthBundleConfig {
  multipleFactorAuth: {
      factors: [
        {
          //name of auth strategy
          strategy: PASSWORD_STRATEGY,
          //front-end url to be redirected to,in order to login this strategy method as well
          redirectUrl: "http://localhost:8080/login",
        },
        {
          strategy: MAGIC_AUTH_STRATEGY,
          redirectUrl: "http://localhost:8080/request-magic-link",
        },
      ],

      //this Optionnal method decide if the user have to multiple factor or not, the default methdod is to judge user based on last loginAt < 24h ,
      userHaveToMultipleFactorAuth: (userId: UserId):Promise<boolean> => {
        ...
      };
    }
}

//If You want your guardian login mutation to expect multiple factor strategy, you have to set it it up too :
//in Admin kernel config:
export const kernel = new Kernel({
  bundles: [
    new XUIBundle({
      guardian: {
        multipleFactorAuth: true,
      },
      graphql: {
        uri: process.env.API_URL,
      },
    }),
    new UIAppBundle(),
    new XUIAdminBundle(),
  ],
});
```

And how it's working, is if the `userHaveToMultipleFactorAuth` return `true` for a user, it will create a session and check just the auth strategy method he just login using for example password, and instead of returning the token, it redirect to the next un-checked auth strategy,

If you decide to override logic and extend from `IMultipleFactorService`, you can implement what ever auth strategy, just give a strategy name and a redirect link

## Social Auth - Passport

Bluelibs contains a feature that allows you to use what ever passport strategy, with simple user data control logic valid for all strategies:

```ts
// The configuration is:
export interface IXAuthBundleConfig {
  socialAuth: {
    //decide what to do with user Data after collecting profile data
    onSocialAuth?: (
      req,
      type,
      uniqueProperty,
      accessToken,
      refreshToken,
      profile,
      done
    ) => any;
    services: {
      facebook: {
        settings: {
          clientID: "";
          clientSecret: "";
          authParameters: {
            profileFields: [
              "id",
              "displayName",
              "photos",
              "email",
              "gender",
              "name"
            ];
            scope: ["email"];
          };
        };
        url: {
          // the url for social auth
          auth: "/auth/facebook";
          callback: "/auth/facebook/callback";
          //the success url redirect to your frontend app with a token param
          success: "http://localhost:8080/auth/social/";
          //the failure url redirect to your frontend app
          fail: "http://localhost:8080/login";
        };
      };
      google: {
        settings: {
          clientID: "";
          clientSecret: "";
          authParameters: {
            scope: ["profile", "email"];
          };
        };
        url: {
          auth: "/auth/google";
          callback: "/auth/google/callback";
          success: "http://localhost:8080/auth/social/";
          fail: "http://localhost:8080/login";
        };
      };
      github: {
        settings: {
          clientID: "";
          clientSecret: "";
          authParameters: {
            scope: ["user:email"];
          };
        };
        url: {
          auth: "/auth/github";
          callback: "/auth/github/callback";
          success: "http://localhost:8080/auth/social/";
          fail: "http://localhost:8080/login";
        };
      };
    };

    url: "http://loclahost:5000"; // this will be the express app  url
  };
}
```
