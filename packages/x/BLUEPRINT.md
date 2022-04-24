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

This will generate:

- Server-side:
  - Collections
  - Models
  - GraphQL Types
  - GraphQL CRUDs
    - Queries and Mutations for CRUDs
    - Custom GraphQL Inputs
    - Subscription & Live Data Ready
- Client-side:
  - UI Collections
    - For Isomorphic Interaction with MongoDB
  - CRUD Admin Pages
    - Lists with Search, Pagination and Complex Filters
    - Edit Forms
    - Create Forms
    - Easy Deletion

:::note
You can use the `x` command to generate collections and shared models inside Blueprint: `blueprint:collection` and `blueprint:shared-model`
:::

## Collections

Let's start from scratch with a simple blueprint to walk you through the main concepts

```ts title="blueprint/index.ts"
import { Studio } from "@bluelibs/x";
import { faker } from "@faker-js/faker";

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

### GraphQL

We generate GraphQL entities (models reflecting the ones from the database) and GraphQL Module CRUDs which allow us to interact easily with the server.

If you do not want to have CRUD only, but you need the Entity because it's maybe used by some other entites:

```ts
collection({
  // ...
  enableGraphQL: {
    entity: true,
    crud: false,
  },
});

// Using enableGraphQL: true, will enable both
// Using enableGraphQL: false, will disable both
```

:::note
Having `entity` false, will not create UI Collections, because those collections would have interacted with the CRUD endpoints created.
:::

### Behaviors

This refers to the capability to add [Collection Behaviors from MongoBundle](https://www.bluelibs.com/docs/package-mongo#behaviors)

Be careful with behaviors as they are generated only once, if you want to add a specific behavior after you generated, you either delete the collection file, either add it yourself manually to the collection.

```tsx
collection({
  id: "Users",
  behaviors: {
    timestampable: true,
    softdeletable: true,
  },
});
```

Typically these behaviors also have shortcuts so you can easily configure things like `blameable` relations or `timestampable` fields.

### UI

To customise UI for Collection, like enable create, but disable edit, here is the full config of UI for the collection:

```ts
collection({
  id: "Posts",
  ui: {
    label: "Posts",
    order: 1, // optional if you want to have a specific order for elements
    icon: "BankOutlined", // from: https://ant.design/components/icon/
    list: true,
    edit: true,
    create: true,
    view: true,
    delete: true,
  },
  enableGraphQL: false,
});
```

### Representation

Think of each document having a `toString()` representation of itself. For example `User` would have `fullName`, a Post would maybe have `title`. We need to specify how we represent these collections because when we perform things such as relational viewing or selecting a `User` from a select autocompleted box, to see it properly:

```ts
collection({
  id: "Posts",
  representedBy: "title", // the field title needs to be inside fields[]
});
```

Now when we relate collections to each other, as you'll see a bit below, you can optionally specify a different representation, otherwise it will default to this one.

Note that these fields can also be reducers (again, a concept you will learn below)

## Fields

Fields are essential to describing how your collection model looks like, inside fields we can store relational data (ids from other collections) or any other supported primitive. Fields can also have `subfields` which translates in the output as a nested object.

The typical field looks like this:

```ts
field({
  id: "variableName",
  type: field.types.STRING,

  // Optionals
  description: "What is this field for?", // This would be stored as a comment for both models and 'GraphQL' entities and will be shown as helper text inside the forms
  isArray: false, // (default: false) whether it's an array of elements
  isRequired: true, // (default: true)
  enableGraphQL: true, // (default: true) would this field be present in the API? For example if you store a password hash, then most likely not.
  // Disable all UI by saying ui: false
  ui: {
    label: "Variable Name", // How it is presented in the field
    order: number,
    list: true, // Whether this is presented in the list table of elements
    listFilters: true, // Whether you can filter by it
    view: true, // Whether it's present in the view
    edit: true, // Whether it's present in the edit form
    create: true, // Wheter it's present in the create form,
    form: {
      component: "Input.TextArea", // This supports every data entry from Ant
      props: {}, // Additional props to pass the component like sizes or etc.
    },
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

### Shortcuts

```tsx
// Making it super straight forward to avoid { id, type }
field.string("firstName");
// Add additional options to it
field.string("lastName", { isRequired: true });

// And the rest of the crowd
field.objectId("id");
field.enum("id");
field.integer("id");
field.float("id");
field.date("id");
field.boolean("id");
field.object("id");
```

### Default Values

Default values end-up in your models, your inputs and your forms. They are easy and straight forward to work with. We currently support any `JSON` compatible object and `Date`.

```ts
field.string("firstName", {
  defaultValue: "John", /// 123, true,
});
field.date("createOn", {
  defaultValue: new Date(),
});
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

Enums can also be configured better, especially if you want to add them a comment or modify their database-store value:

```ts
field({
  id: "status",
  type: field.types.ENUM,
  enumValues: [
    {
      id: "IN_PROGRESS",
      value: "IP", // this gets saved in db
      label: "In Progress", // this is how it shows on the UI and creates the propper lables
      description: "This means the the task is in progress", // gets a comment in TS model and GraphQL API
    },
  ],
});
```

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
      fields: [],
      relations: [
        // By default it will create the field `postId` of type ObjectID
        // If you add `isMany: true` to the config, it will create `postIds` of type Array<ObjectID>`
        relation({
          id: "post",
          to: "Posts",
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

If you understand how Nova works, it should be straight forward to understand how these links are described.

Keep in mind, once a link is generated, it won't be able to properly update it. We do not override the `.links.ts` file. So if, let's say you want to change `post` link from `Comments` to `isMany: true`, this change won't be present in the generated code, you'll have to manually do it, or delete the file.

There are many reasons for this, one is the fact that Nova offers a lot of complex additional features to linking data such as Filtered Links and as with reducers we don't want to gobble up the blueprint, we believe this is a reasonable limitation. If you add additional links they will be ofcourse added.

You can customise the fields for storing such data if you wish:

```ts
collection({
  id: "Comments",
  fields: [],
  relations: [
    relation({
      id: "post",

      // To which collection are we linking? Specificy the id
      to: "Posts",

      // By default it is required and it will infer this requiredness to the field if it's a direct relation
      isRequired: true,

      // You can either use a string (of a field already added), omit it (it will generate a default one by suffixing the relation id with 'Id' or 'Ids')
      field: field({
        id: "myCustomPostId",
        type: field.types.OBJECT_ID,
      }),
    }),
  ],
});
```

:::note One-to-One
If you want to benefit of a one-to-one relationship, use `unique: true` inside the direct relationship definition. This will make the inversed side refer to the direct side as a single object instead of an array.
:::

### Rendering

So, relations have an additional field which we call `representedBy` this basically means, if I have a `Post` and I have a post owner which is a `User` how do I show that user? Do I show his id, what fields from user do I show? And the typical answer is either a specific field that indifies it or a reducer. This helps the UI Lists to properly render data and know what to query.

```ts
relation({
  id: "owner",
  to: "Owner",
  representedBy: "fullName",
});
```

## Shared Models & Enums

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
    sharedModel({
      id: "GenericStatus",
      enumValues: ["TO_DO", "IN_PROGRESS"], // same as enum
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
        field.enum("status", {
          model: "GenericStatus", // or () => GenericStatus if you separated it in another file
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

    shortcuts.field.timezone("timezone"), // A simple field enum to easily benefit of timezone configurations

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

## Blendability

By "blendability" we mean that we can perform our own modifications to the code, while supporting subsequent blueprint generations that enhance and extend our app without removing our changes.

All files that get overriden on next generations are marked with the comment:

```ts
/** @overridable */
```

Exception to this rule is the `.json` file for translations that is stored in `{Collection}Management/config/{Collection}.i18n.json`

We advise you not to make any changes directly to those files, their whole concept was designed in a way that they can be extended from your components.

Let's explore the types of customisations we can easily do:

### Forms, Lists, Views

Our Form Schema resides in `{Collection}Management/config/{Entity}CreateForm.base.tsx`. We do our modifications inside `{Collection}Management/config/{Entity}CreateForm.tsx`.

```tsx title="{Entity}CreateForm.tsx"
build() {
  super.build();

  // For example you want the description to become a TextArea instead of an input
  this.update("description", {
    render() {
      return <Ant.Form.Item><TextArea /></Ant.Form.Item>
    },
    // Any other value as accepted by the Consumer

    // You can also configure the order they are presented in
    order: 1,
  })
}
```

This exact same concept is applied to all forms and all views.

If you want to request new fields from the API or remove certain fields, you have two options:

1. Remove them from blueprint's ui
2. Remove them from the consumer and from the requestBody

Edit forms, lists, views do requests. This request is done via `static getRequestBody()` which is a Nova Request Body.

To customise this request to fit your needs:

```ts
class SampleForm {
  static getRequestBody(): QueryBodyType<ProjectsAsset> {
    // You have the ability to modify the request by adding certain fields or relations
    const requestBody = super.getRequestBody();
    Object.assign(requestBody, {
      newField: 1,
    });

    return requestBody;
  }
}
```

### Routes

Sometimes you might want to apply some security logic to your routes:

```tsx title="{CollectionManagement}/routes.tsx"
import { UserRoles } from "@root/api.types";

export const PROJECTS_ASSETS_CREATE = {
  ...BASE_PROJECTS_ASSETS_CREATE,
  roles: [UserRoles.ADMIN],
};
```

### Menus

You have the ability to configure the icon from [@ant-design/icons](https://ant.design/components/icon/) easily via `collection.ui.icon`, but if you want a custom icon to the menu:

If you want to customise the label either you do it via `blueprint`, or by configuring the translation of it inside `${Collection}Management/i18n.ts` for `management.projects_assets.menu.title`

```tsx title="{CollectionManagement}/routes.tsx"
import { MyIconSvg } from "...";

export const PROJECTS_ASSETS_LIST = {
  ...BASE_PROJECTS_ASSETS_LIST,
  menu: {
    ...BASE_PROJECTS_ASSETS_CREATE.menu,
    icon: MyIconSvg,
  },
};
```

If you want to add the menu as a submenu, we use the `inject` functionality:

```tsx
import { MyIconSvg } from "...";

export const PROJECTS_LABELS_LIST = {
  ...BASE_PROJECTS_LABELS_LIST,
  menu: {
    ...BASE_PROJECTS_LABELS_LIST.menu,
    inject: "PROJECTS_ASSETS_LIST", // This would appear as a submenu under the "Project Assets"
  },
};
```

### I18N

The translations inside `{Collection}Management/config/{Collection}.i18n.json` will get overriden everytime. If you want to add your own translations the place to do so is inside `${Collection}Management/i18n.ts`

```tsx
import { i18n } from "@bundles/UIAppBundle/i18n";
import phrases from "./config/ProjectsAssets.i18n.json";

phrases.management.projects_assets.menu.title = "My Custom Menu";

i18n.push(phrases);

// You can override additional messages here by using i18n.push();
```

### Server Inputs & Models

For `create` and `edit` operations we call `{Collection}InsertOne` and respectively `{Collection}UpdateOne` mutations. The inputs used are `{Entity}InsertInput` and `{Entity}UpdateInput`.

These inputs are stored in `api` under `bundles/AppBundle/services/inputs`. As you already know, the `.base` files get overriden but you can customise your validation logic and what not inside the regular ones:

```tsx
import { Schema, Is, a, an } from "@bluelibs/validator-bundle";
import { ContactUpdateInput as BaseContactUpdateInput } from "./ContactUpdate.input.base";

@Schema()
export class ContactUpdateInput extends BaseContactUpdateInput {
  @Is(a.string().min(2))
  firstName: string;
}
```

By default `Blueprint` doesn't allow such customisations from the get-go it only adds things such as `nullability` and type, but it's easy to just go in the file and add them yourself.

The exact same concept applies to Collection models, you can extend them with ease, adding custom validations and maybe some custom methods that would ease development.

## Live Data

If you want to view data in a live manner it's sufficient to change `useData` with `useLiveData` everything should work as you expect it to. Read more on the `Live Data` section in the X-UI Core principles.

## Generation Customisation

The `generateProject` functions allows certain alterations:

```ts
generateProject({
  // It will override, the non-overridable files, use it with caution and on a previously committed repo
  override: true,
  generators: [
    // BACKEND MONGO COLLECTIONS
    GeneratorKind.BACKEND_COLLECTIONS,

    // GRAPHQL CRUDS
    GeneratorKind.BACKEND_CRUDS,

    // GRAPHQL Entities and inputs
    GeneratorKind.BACKEND_GRAPHQL,

    // BACKEND MONGO COLLECTIONS FIXTURES
    GeneratorKind.BACKEND_FIXTURES,

    // The UI Collections
    GeneratorKind.FRONTEND_COLLECTIONS,

    // The actual pages with CRUD info in them
    GeneratorKind.FRONTEND_CRUDS,

    // Authentication, development, etc, run only once when microservice is created
    GeneratorKind.FRONTEND_BOILERPLATE_COMPONENTS,
  ],
  writers: {
    // Writers receive models and a session, based on it they perform writes of the files
    // They are self-explanatory feel free to browse the code located in:
    // https://github.com/bluelibs/bluelibs/blob/main/packages/x/src/writers/
    microservice: Writers.MicroserviceWriter,
    collection: Writers.CollectionWriter,
    graphQLCRUD: Writers.GraphQLCRUDWriter,
    genericModel: Writers.GenericModelWriter,
    graphQLEntity: Writers.GraphQLEntityWriter,
    graphQLInput: Writers.GraphQLInputWriter,
    collectionLink: Writers.CollectionLinkWriter,
    uiCollection: UICollectionWriter,
    uiCollectionCRUD: UICollectionCRUDWriter,
    fixture: Writers.FixtureWriter,
  },
});
```

By offering this customisability, in theory, you can iteratively use less of the `blueprint` features and also customise the way you write the files. If you are ambitious enough you could create such writers that write something completely different from `X-Framework` or `Foundation` like using `Vue` instead of `React`, that's how customisable and flexible this is. However, from our experience, it's not an easy task to run such generations while taking care of all the details.
