Blueprint is a paradigm that lets you write schema code and it can generate code while at the same time giving you the ability to add features, modify code and also support additional functionalities.

Because Blueprint outputs an X-Framework compatible project, it's important that you have you are up to date with the X-Framework basics.

To get directly into try-ing it:

```bash
npm i -g @bluelibs/x
x
```

Choose `x:project` and create your new project:

```
cd project
npm install
```

You will notice a `blueprint/index.ts` file which only has `Users` collection setup. To generate the project:

```
npm run blueprint:generate
```

This will generate

- Server-side:
  - Collections
  - Models
  - GraphQL CRUDs
- Client-side:
  - UI Collections
  - API Types
  - CRUD Admin Pages

## Basics

Let's start from scratch with a simple blueprint to walk you through the main concepts

```ts title="blueprint/index.ts"
import { Studio } from "@bluelibs/x";
import * as faker from "faker";

const { generateProject, app, collection, field, relation, sharedModel } =
  Studio;

const application = app({
  id: "my-app",
  collections: [
    // Here you will store your collections
    collection({
      id: "Posts",
      description: "What is this collection for", // optional
      fields: [
        // Here we specify the fields for collection
        field({
          id: "title",
          type: fields.types.STRING,
        }),
      ],
    }),
  ],
});

// This is what triggers the generation of the project
generateProject(application);
```

By default all collections and fields are `ui` aware and exposed in the GraphQL API. To disable this behavior for collections or fields:

```ts
collection({
  id: "Posts",
  ui: false,
  enableGraphQL: false,
});
```

To customise UI for Collection, like enable create, but disable edit, here is the full config of UI for the collection:

```ts
collection({
  id: "Posts",
  ui: {
    label: "Posts",
    order: 1, // optional if you want to have a specific order for elements
    list: true,
    edit: true,
    create: true,
    view: true,
    delete: true,
  },
  enableGraphQL: false,
});
```

## Fields

Fields are essential to describing how your collection model looks like, inside fields we can store relational data (ids from other collections) or any other supported primitive. Fields can also have `subfields` which translates in the output as a nested object.

The typical field looks like this:

```ts
field({
  id: "variableName",
  type: field.types.STRING,

  // Optionals
  description: "What is this field for?", // This would be stored as a comment for both models and graphql entities and will be shown as helper text inside the forms
  isArray: false, // (default: false) whether it's an array of elements
  isRequired: true, // (default: false)
  enableGraphQL: true, // (default: true) would this field be present in the API? For example if you store a password hash, then most likely not.
  // Disable all UI by saying ui: false
  ui: {
    label: "Variable Name", // How it is presented in the field
    order: number,
    list: true, // Whether this is presented in the list table of elements
    listFilters: true, // Whether you can filter by it
    view: true, // Whether it's present in the view
    edit: true, // Whether it's present in the edit form
    create: true, // Wheter it's present in the create form
  },
});
```

The available field types:

```ts
export enum FieldValueKind {
  OBJECT_ID = "objectId",
  STRING = "string",
  ENUM = "enum",
  INTEGER = "integer",
  FLOAT = "float",
  DATE = "date",
  BOOLEAN = "boolean",
  OBJECT = "object",
}
```

### Nested Fields

You can benefit of nested fields which act as sub models, don't worry, the form will properly generate your code so you don't have to think about it.

```ts
field({
  id: "profile",
  type: field.types.OBJECT,
  subfields: [
    field({
      id: "firstName",
      type: field.types.STRING,
    }),
    field({
      id: "lastName",
      type: field.types.STRING,
    }),
  ],
});
```

Assuming we add this field in `Users` collection, this would create a new type in GraphQL `UserProfile` and a new class with validation `UserProfile`, you don't even have to think about it. And ofcourse it works with arrays too.

### Enums

Enums are great especially when your field belongs to a set of values:

```ts
field({
  id: "status",
  type: field.types.ENUM,
  enumValues: [`IN_PROGRESS`, `ACTIVE`, `CLOSED`],
});
```

Assuming we add this field in `Tasks` collection it will create a proper TS enum: `TaskStatus` and inside the forms it will be a select dropdown option. You can also make it an array.

### Reducers

Reducers are Nova's way of computing values based on certain dependencies:

```ts
field({
  id: "fullName",
  type: field.types.STRING,
  isReducer: true,
  reducerDependency: {
    profile: {
      firstName: 1,
      lastName: 1,
    },
  },
});
```

Here comes an interesting thing. Reducers will be stored inside `collections/Users/Users.reducers.ts`, however the logic, the actual function, you'll have to write it yourself in there. This won't be overriden on subsequent generations as it will check if it exists. This is an intentional limitation of Blueprint, as we don't want to gobble it with a lot of functionality, plus, reducers can get very complex, however it's important to have them here because they can appear inside Lists, View, and when you are selecting remote data (example you want to assign an Invoice to a User, and you display `fullName` of those users)

## Relations

Relations are described the same way Nova relations are, they are stored at collection level under `relations: []`, like this:

```ts
app({
  collections: [
    collection({
      id: "Comments",
      fields: [
        // rest of fields
        field({
          id: "postId",
          type: field.types.OBJECT_ID,
        }),
      ],
      relations: [
        relation({
          id: "post",
          to: "Posts",
          field: "postId",
          isMany: false,
        }),
      ],
    }),
    collection({
      id: "Posts",
      fields: [], // some fields
      relations: [
        relation({
          to: "Comments",
          inversedBy: "post", // the "id" of the other's side link
        }),
      ],
    }),
  ],
});
```

If you understand how nova works, it should be straight forward to understand how these links are described.

Keep in mind, once a link is generated, it won't be able to properly update it. We do not override the `.links.ts` file. So if, let's say you want to change `post` link from `Comments` to `isMany: true`, this change won't be present in the generated code, you'll have to manually do it, or delete the file.

There are many reasons for this, one is the fact that Nova offers a lot of complex additional features to linking data such as Filtered Links and as with reducers we don't want to gobble up the blueprint, we believe this is a reasonable limitation. If you add additional links they will be ofcourse added.

For shorthand reasons, you can also add the field directly inside the relation:

```ts
collection({
  id: "Comments",
  fields: [],
  relations: [
    relation({
      id: "post",
      to: "Posts",
      field: field({
        id: "postId",
        type: field.types.OBJECT_ID,
      }),
      isMany: false,
    }),
  ],
});
```

### Rendering

So, relations have an additional field which we call `representedBy` this basically means, if I have a `Post` and I have a post owner which is a `User` how do I show that user? Do I show his id, what fields from user do I show? And the typical answer is either a specific field that indifies it or a reducer. This helps the UI Lists to properly render data and know what to query.

```ts
relation({
  id: "owner",
  to: "Owner",
  representedBy: "fullName",
});
```

## Shared Models

Shared models are very useful especially when you have the same type of data in multiple collections. A very common use case is `Address`:

```ts
app({
  sharedModels: [
    sharedModel({
      id: "Address",
      fields: [
        // Normal field configuration as you're used to
      ],
    }),
  ],
  collections: [
    collection({
      id: "Orders",
      fields: [
        field({
          id: "customerAddress",
          type: field.types.OBJECT,
          model: "Address", // you can also use a reference to an actual sharedModel or a function that returns it (useful for file splitting)
        }),
      ],
    }),
  ],
});
```

So there are two steps, you define the shared models at application level, then you choose which field represents it. The model definition is stored separate and re-used by all, including validation and everything you would expect.

## Uploads

If you want to benefit of uploads using S3 via XS3Bundle, then you need to add a relation to "AppFiles" like this:

```ts
relation({
  id: "pictures",
  to: "AppFiles",
  isMany: false, // you can also have multiple uploads
  field: s.field({
    id: `${id}Id`,
    type: s.field.types.OBJECT_ID,
  }),
  ui: {
    create: true,
    edit: true,
    list: true,
    listFilters: false,
    view: true,
  },
  ...override,
});
```

You can also have a file group, a file group is basically a separate entity which stores multiple files.

```ts
return s.relation({
  id: "houseGallery",
  to: "AppFileGroups",
  isMany: false,
  field: s.field({
    id: `${id}Id`,
    type: s.field.types.OBJECT_ID,
  }),
  ui: {
    create: true,
    edit: true,
    list: true,
    listFilters: false,
    view: true,
  },
  ...override,
});
```

This can be easily done with shortcuts, which is described right in the next chapter.

## Shortcuts

You can easily create your own shortcuts by simply re-using fields, but we offer some sensible ones to aid you in your journey:

```ts
collection({
  id: "Some Collection",
  fields: [
    // This is the classic `_id` of ObjectId type
    shortcuts.field.id(),
    // isDeleted field works with deletable behavior
    shortcuts.field.softdeletable(),
    shortcuts.user.password(), // This stores the `IPasswordAuthenticationStrategy` from PasswordBundle

    // This adds createdAt and updatedAt (note the ... and "fields")
    ...shortcuts.fields.timestampable(),
    // This adds createdById and updatedById
    ...shortcuts.fields.blameable(),

    // This adds the necessary fields required for `IUser` from SecurityBundle
    ...shortcuts.fields.user.standard(),
  ],

  relations: [
    // This adds a link to user via "owner" and with
    shortcuts.relation.user({ id: "owner" }),

    // Adds createdBy and updatedBy (works with Blameable behavior)
    ...shortcuts.relations.blameable()

    // Files
    shorcuts.relation.file("picture"),
    shorcuts.relation.files("pictures"),
    shorcuts.relation.fileGroup("pictureGallery"),
  ],
});
```

Feel free to get creative and create your own shortcuts for things you realise you use on multiple collections, but keep in mind to work with new instances of fields:

```ts
// BAD
const shortcutField = field({ ... });

// GOOD
const shortcutField = () => field({ ... })
```

## Scaling File Structure

You will soon realise, right after you've added your 3rd collection that it's too much to handle everything in one file, feel free to split these collections in their own files and use them like that.

```ts file="collection.ts"
import { Studio as s } from "@bluelibs/x";

s.field({
  // ... etc ///
});
```

## Blendability

All files that get overriden on next generations are marked with the comment:

```ts
/** @overridable */
```

We advise you not to make any changes directly to those files, their whole concept was designed in a way that they can be extended from your components.

## UI Customisation

### Customise Lists

- TBD

### Customise Forms

- TBD

### Customise Views

- TBD

### Change Order of Fields

- TBD

### Change Icons of Items

- TBD

### Change Roles For Specific Lists

- TBD

## Generation Customisation

This goes in depth exploring the options
