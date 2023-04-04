S3Upload bundle allows you to easily upload files to Amazon S3 by helping you upload files, storing metadata about the files in a separate collection `AppFiles` and providing resolvers to download the urls.

We are using [Apollo Upload scalar](https://www.apollographql.com/docs/apollo-server/data/file-uploads/) to transfer the files through the GraphQL API.

## Setup

```bash
npm i -S graphql-upload aws-sdk @bluelibs/x-s3-bundle
```

we can set up multiple stores, witha defined default store

```ts
import { XS3Bundle } from "@bluelibs/x-s3-bundle";

kernel.addBundle(
  new XS3Bundle({
    stores: [
      new Stores.S3({
        id: env.S3_MAIN,
        credentials: {
          accessKeyId: env.AWS_ACCESS_KEY_ID,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
          bucket: env.AWS_BUCKET,
          region: env.AWS_REGION,
          endpoint: env.AWS_ENDPOINT,
        },
        //the s3 store will be the default store, if not defined by default the first store of the stores iwll be the default
        default: true,
      }),
      new Stores.Azure({
        id: "azure-storage",
        credentials: {
          connectionId: env.AZURE_CONNECTION,
          containerName: env.AZURE_ENDPOINT,
          endpoint: env.AZURE_ENDPOINT,
        },
      }),
      new Stores.Local({
        id: env.LOCAL_STORAGE,
        credentials: {
          localStoragePath: "./temp",
          downloadUrl: "/download-local-file",
        },
      }),

      new Stores.Database({
        id: env.DB_STORAGE,
        credentials: {
          downloadUrl: "/download-db-file",
        },
        // override the thumbs config for this specifiq store
        thumbs: [
          {
            id: "small",
            width: 128,
            height: 128,
          },
        ],
      }),
    ],
  })
);
```

### Custom store

you can always implement your own custom store :

```ts
export class CustomStore extends IStoreUploadService {
  constructor(storeConfig: StoreConfig) {
    super(storeConfig);
    this.thirdPartyInstance=new ThirdParty(storeConfig.credentials);
  }

  writeFile(fileKey, mimeType, buffer) {
    return this.thirdPartyInstance.write(...)
  }
  deleteFile(key) {
    return this.thirdPartyInstance.delete(key)
  }
  getDownloadUrl(key):string{
    return this.thirdPartyInstance.generateDownloadUrl(key)
  }
}
```

and in the setup you can just :

```ts
new XS3Bundle({
    stores: [
      ...stores,
      new CustomStore({id:"main_custom_store",credentials:{..}})
      ]
})
```

## Uploading

A good tutorial to show-case the full flow [can be found here](https://www.apollographql.com/blog/graphql/file-uploads/with-react-hooks-typescript-amazon-s3-tutorial/)

The typical process is that from your client you have added the [Apollo Upload Link](https://github.com/jaydenseric/apollo-upload-client). This is by default included in `x-ui` package so you don't have to worry. What it does is that it transforms the HTTP request into a multi-part form to send the files (if there are any)

```ts
import { UploadService, AppFilesCollection } from "@bluelibs/x-s3-bundle";

const types = `
  type Mutation {
    upload(file: Upload!): Boolean
  }
`;

async function uploadResolver(_, args, ctx) {
  // The file is the GQL Upload Scalar
  const { file } = args;

  const uploadService = ctx.container.get(UploadService);

  const appFile = await uploadService.upload(file, {
    uploadedById: ctx.userId,
  });

  return true;
}
```

Now, in most cases what interests you is that `downloadable url` so the user can access it. To do this we have the following options.

Through `UploadService`:

```ts
import { UploadService } from "@bluelibs/x-s3-bundle";

const uploadService = ctx.container.get(UploadService);
uploadService.getFileURL(appFile._id); // This will return a fully downloadable path
```

Through [Nova](https://www.bluelibs.com/docs/package-nova):

```ts
const appFile = appFiles.queryOne({
  $: {
    filters: { _id: appFile.id },
  },
  name: 1,
  // This is a reducer that will use the UploadService to give you the url
  downloadUrl: 1,
});
```

If you want to upload without `GraphQL`:

```ts
const uploadService = ctx.container.get(UploadService);
const appFile = uploadService.doUpload(filename, mimeType, buffer);
```

the previous will target the store by default,

if you want to target the upload to a specifiq store, you can target by the storeId

```ts
const appFile = uploadService.doUpload(filename, mimeType, buffer, storeId);
```

## Removing Files

When you remove the file, you would expect that it also gets deleted from the S3 Bucket. You would be correct. If you do:

```ts
const appFilesCollection = container.get(AppFilesCollection);
appFilesCollection.deleteOne({ _id: appFile._id }); // deletes it from s3 and from the database
```

## Data Models

```ts
export class AppFileGroup {
  _id: ObjectID;
  name?: string;
  files: AppFile[];
  filesIds: ObjectID[];
}

export class AppFile {
  _id: ObjectID;
  name: string;
  path: string;
  size: number;
  mimeType: string;

  metadata: object;

  //store Id
  store: string;

  /**
   * To have a generic way of linking data
   */
  resourceId?: ObjectID;
  resourceType?: string;

  uploadedBy?: IUser;
  uploadedById?: ObjectID;

  /**
   * @reducer
   */
  downloadUrl: string;

  groups?: AppFileGroup[];
  createdAt: Date;
  updatedAt: Date;
}
```

## Real world usage

### Single Uploads Storage

In GraphQL typing it will look something like this:

```ts
type User {
  avatar: AppFile
}
```

```graphql
query me {
  avatar {
    """
    Keep in mind that you should do a Nova query in your "me" resolver if you want this to work as downloadUrl is a reducer.
    Otherwise, you could write your own field resolver which uses `FileManagementService` to deliver the downloadUrl
    """
    downloadUrl
  }
}
```

When adding the avatar, after uploading it can look something like this:

```ts
import { AppFilesCollection } from "@bluelibs/x-s3-bundle";

// Sample of linking of files
class UsersCollection extends Collection {
  static links = {
    //
    avatar: {
      collection: () => AppFilesCollection,
      field: "avatarId",
    },
  };
}
```

A sample resolver how you would update this:

```ts
async function uploadAvatarResolver(_, args, ctx) {
  // TODO: check if there is a previous avatar and delete it.

  const uploadService = ctx.container.get(UploadService);
  const appFile = await uploadService.upload(args.file, {
    uploadedById: ctx.userId,
  });

  const usersCollection = ctx.container.get(UsersCollection);
  usersCollection.updateOne(
    { _id: ctx.userId },
    {
      $set: {
        avatarId: appFile._id,
      },
    }
  );
}
```

### Multiple Uploads Storage

While the single upload solution is straight forward, there will be a lot of cases in which you want to add many files to your models. For example, a comment can have many pictures, a task can have many attachments, and so on. To aid this we created a separate collection called `AppFileGroups` to aid us:

Let's assume we create our task, and we have `fileGroupId` linked with `AppFileGroups` through Nova:

```ts
const fileManagementService = ctx.container.get(FileManagementService);
const fileGroupId = fileManagementService.newFileGroup(); // This will return a fully downloadable path
tasksCollection.insertOne({
  title: "Hello",
  fileGroupId,
});

// Now when you do  the upload and you have the file
const appFile = await uploadService.upload(args.file, {
  uploadedById: ctx.userId,
});

fileManagementService.addFileToFileGroup(fileGroupId, appFile._id);

// Now you can query it through Nova:
query = `
  query {
    tasks {
      fileGroup {
        files {
          name
          mimeType
          downloadUrl
        }
      }
    }
  }
`;
```

Deleting a file that it also clears all the file groups containing it. You don't have to worry.

As a concept, a `File` can belong in multiple `FileGroups`. If, let's say you want in the future to be smart and reuse the files. If you want to remove the file only from a specific file group and not delete it, just run a MongoDB update and use `$pull` on `fileIds` inside `AppFileGroups` collection.

## Customise Collections

If you want to add new files or new things, you can do that by customising your own models
You can by entering your own custom collection and model:

```ts
class MyAppFilesCollection extends AppFilesCollection<MyAppFileModel> {}
class MyAppFileGroupsCollection extends MyAppFileGroupsCollection<MyAppFileGroupModel> {}

kernel.addBundle(
  new XS3Bundle({
    // the rest
    appFilesCollection: MyAppFilesCollection,
    appFileGroupsCollection: MyAppFileGroupsCollection,
  })
);
```

## Customise Upload Logic

This can be used to either have multiple uploading buckets, either override and customise the logic.

```ts
class ImageUploadService extends UploadService {
  constructor() {
    super(NEW_AWS_CONFIG);
  }

  upload(upload: Promise<Upload>, extension?: Partial<AppFile>) {
    // Do your own thing
    // this.doUpload()
  }

  public async uploadBuffer(
    filename: string,
    mimetype: string,
    buffer: Buffer
  ): Promise<string> {
    // upload the file and return an identificator string
  }
}
```

## Images

By default this package optimises `jpeg` and `png` by using `imagemin` library. Opt-out of this behavior by using:

```ts
new XS3Bundle({
  optimizeImages: false,
});
```

At the same time for images we also create 3 thumbnails: `large` (512x512), `medium` (256x256), `small` (128x128). We do this for all images by default and we use `sharp` behind the scnes. If you want to customize this:

```ts
new XS3Bundle({
  thumbs: [
    // Keep in mind that overriding this will no longer do the defaults `large`, `medium`, `small` thumbs.
    {
      id: "small",
      height: 256,
      width: 256,
      // (optional) Files can have a context, it will only process this thumb for images in this context. Omit if you want to apply to all contexts
      contexts: ["avatars"],
      // (optional) Resize options from "sharp"
      resizeOptions: {},
    },
  ],
});
```

Note: context is passed by extension of the app file:

```ts
const appFile = await uploadService.upload(file, {
  uploadedById: ctx.userId,
  context: ["avatar"],
});
```

:::note
When fetching with GraphQL you'll receive a deprecation notice on thumbs.id, that is because you should use `type` instead of `id` on your frontend. To ensure you don't mess with Apollo Client cache.
:::

## Events

We expose two events: `AfterFileUploadEvent` and `BeforeFileUploadEvent`, each contains data relevant to its processing, you could opt-out completely of custom image processing by doing:

```ts
new XS3Bundle({
  // Now you can control this by hooking into a BeforeFileUploadEvent
  thumbs: [],
  optimizeImages: false,
});
```

```ts
eventManager.addListener(BeforeFileUploadEvent, (e) => {
  const { extension, mimetype, filename, buffer } = e.data;
  // Do your own preparation and update extension as you see it fit.
});
```
