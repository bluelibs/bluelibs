<h1 align="center">BlueLibs SECURITY-MONGO-BUNDLE</h1>

[![npm version](https://badge.fury.io/js/%40bluelibs%2Fsecurity-mongo-bundle.svg)](https://badge.fury.io/js/%40bluelibs%2Fsecurity-mongo-bundle)
[![CI](https://github.com/bluelibs/bluelibs/actions/workflows/lint-and-test.yml/badge.svg)](https://github.com/bluelibs/bluelibs/actions/workflows/lint-and-test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

In this bundle we're overriding the persistence layers from SecurityBundle to make them work with MongoBundle.

## Installation

```bash
npm i -S @bluelibs/security-bundle @bluelibs/security-mongo-bundle
```

```js
import { SecurityBundle } from "@bluelibs/security-bundle";
import { SecurityMongoBundle } from "@bluelibs/security-mongo-bundle";

kernel.addBundle(
  new SecurityBundle({
    // options
  }),
  // Order doesn't really matter.
  new SecurityMongoBundle()
);
```

## Overriding

You have the option to make changes to your collections, for example if you user is linked to other collections or you simply want a different collectioName:

```typescript
import {
  UsersCollection,
  PermissionsCollection,
} from "@bluelibs/security-mongo-bundle";
import { IUser } from "@bluelibs/security-bundle";

// We make the type behave with all of our needs
interface IAppUser extends IUser {
  profileId: ObjectID;
}

class AppUsersCollection extends UsersCollection<IAppUser> {
  static collectionName = "User"; // override it, by default it's "users"

  static links = {
    profile: {
      collection: () => ProfilesCollection,
      field: "profileId",
    },
  };

  static indexes = [
    {
      key: {
        profileId: 1,
      },
    },
  ];
}
```

```typescript
new SecurityMongoBundle({
  usersCollection: AppUsersCollection,
});
```

## Support

This package is part of [BlueLibs](https://www.bluelibs.com) family. If you enjoy this work please show your support by starring [the main package](https://github.com/bluelibs/bluelibs). If not, let us know what can we do to deserve it, [our feedback form is here](https://forms.gle/DTMg5Urgqey9QqLFA)
