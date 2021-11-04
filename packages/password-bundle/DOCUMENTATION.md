## Install

```bash
npm i -S @bluelibs/security-bundle @bluelibs/password-bundle
```

```ts
import { SecurityBundle } from "@bluelibs/security-bundle";
import { PasswordBundle } from "@bluelibs/password-bundle";
const kernel = new Kernel({
  bundles: [new SecurityBundle(), new PasswordBundle()],
});
```

## Purpose

This is an authentication strategy implemented for the `SecurityBundle`. It does not expose any routes, nor does it send any emails and it doesn't care about your persistance layer (database-agnostic). It just focuses on the `raw` handling of passwords for a user.

```typescript
import { PasswordBundle } from "@bluelibs/password-bundle";

new PasswordBundle({
  // All of these are optional, these are the defaults
  failedAuthenticationAttempts: {
    lockAfter: 10,
    cooldown: "10m", // After how much time of invalid passwords you can try again to login
  },
  resetPassword: {
    cooldown: "5m", // After how much time you can request ANOTHER password reset request
    expiresAfter: "2h", // How much time do we allow for the token to exist
  },
});
```

It all starts with a user:

```typescript
import { SecurityService } from "@bluelibs/security-bundle";
import { PasswordService } from "@bluelibs/password-bundle";

const securityService = container.get(SecurityService);
const passwordService = container.get(PasswordService);

const userId = await this.securityService.createUser();

// Now that we have the user we attach options to it
await passwordService.attach(userId, {
  username: "USERNAME", // in most situation the username is the email, in fact.
  email: "USERNAME@MAIL.COM";
  password: "PASSWORD",
  isEmailVerified: false;
});
```

Finding a userId by username:

```typescript
const userId = await passwordService.findUserIdByUsername("username");
```

Checking is password is valid:

```typescript
const isValid = await passwordService.isPasswordValid(userId, "PASSWORD");
```

Note that password validation will also register invalid attempts, and depending on how you have configured the bundle it can temporary suspend the user.

If you want to bypass this functionality you can pass as the 3rd argument:

```typescript
passwordService.isPasswordValid(userId, "PASSWORD", {
  failedAuthenticationAttemptsProcessing: false;
})
```

## Forgot Password

This contains the full flow of a forgot password process. First we get a token to reset the password send send it by email, then we check if the token is valid and we reset it with it.

```typescript
const token = await passwordService.createTokenForPasswordReset(userId);

const isTokenValid = await passwordService.isResetPasswordTokenValid(
  userId,
  token
);

await passwordService.resetPassword(userId, token, "NEW_PASSWORD");
```

## Set Password

Overriding a password is as easy as:

```typescript
await passwordService.setPassword(userId, "NEW_PASSWORD");
```

The passwords are hashed individually per user's salt via `sha512`

## Events

This events can be imported from the package. So you can listen to them.

- PasswordAuthenticationStrategyAttachedEvent
  - A new strategy has been attached to the user
- PasswordResetRequestedEvent
  - The user has requested a forgot password
- PasswordResetWithTokenEvent
  - The user has reset his password
- PasswordInvalidEvent
  - A user has tried to login but password was invalid
- PasswordValidatedEvent
  - This is a successful password validation (this can happen in change password as well)
  - This can be regarded as a user logged in, but you have this event at `Security` level.
- UserLockedAfterFailedAttemptsEvent
  - We emit this after too many invalid password entries

## Exceptions

- CooldownException
  - This is triggered when he tries to login after many failed login attempts
- PasswordResetExpiredException
  - Someone tried to reset his password with a token that expired. Look at `expiresAfter` in config.
- ResetPasswordInvalidTokenException
  - Someone tried to reset password with an invalid token

## Data Model

The data we store to manage everything in the strategy looks like this:

```ts
export interface IPasswordAuthenticationStrategy {
  username: string;
  email?: string;

  isEmailVerified?: boolean;
  emailVerificationToken?: string;

  // Unique salt per user
  salt: string;
  passwordHash: string;
  lastSuccessfulPasswordValidationAt: Date;

  // Resetting the password
  resetPasswordVerificationToken: string; // optional when resetting the password
  resetPasswordRequestedAt: Date;

  // Failed login attempts
  currentFailedLoginAttempts: number;
  lastFailedLoginAttemptAt: Date;
}
```

You can update things such as `username` and `email`:

```ts
import { PasswordService } from "@bluelibs/password-bundle";

const passwordService = container.get(PasswordService);

await passwordService.updateData(userId, {
  username: "new-username",
  email: "new-email",
});

const data = await passwordService.getData(userId);
```

## Custom Hasher Service

```ts
@Service()
class MyHasherService implements IHasherService {
  //   generateSalt(userId?: any): string;
  //   getHashedPassword(plainPassword, salt?: string): string;
  //   generateToken(userId?: any): string;
}

class AppBundle extends Bundle {
  async init() {
    this.container.set({
      id: HASHER_SERVICE_TOKEN,
      type: MyHasherService,
    });
  }
}
```

## Meta

### Summary

This is the raw functionality of handling passwords. A complete integration for this is done inside [XPasswordBundle](package-x-password-bundle) that is X-Framework compatible.

### Boilerplates

- COMMING SOON

### Challenges

- What does `cooldown` inside `resetPasword` represent? (1p)
- Can I use this bundle in such a way that I prevent a password brute-force attack? How? (2p)
- Write an app, in which a user has had too many invalid authentication attempts is sent a warning email and suspend the user? (2p)
