import * as X from "@bluelibs/x-bundle";
import { IResolverMap } from "@bluelibs/graphql-bundle";
{{# if hasCustomInputs }}
  {{ inputsImportLine }}
{{/ if }}
{{ collectionImportLine }}

export default {
  Query: [
    [
      {{# if checkLoggedIn }}
      X.CheckLoggedIn(),
      {{/ if }}
      {{# if permissionCheck }}
      X.CheckPermission(['ADMIN']),
      {{/ if }}
    ], 
    {
      {{ crudName }}FindOne: [
      X.ToNovaOne({{ collectionClass }})
      ],
      {{ crudName }}Find: [
      X.ToNova({{ collectionClass }})
      ],
      {{ crudName }}Count: [
      X.ToCollectionCount({{ collectionClass }})
      ]
    }
  ],
  Mutation: [
    [
    {{# if checkLoggedIn }}
    X.CheckLoggedIn(),
    {{/ if }}
    {{# if permissionCheck }}
      X.CheckPermission(['ADMIN']),
    {{/ if }}
    ], {
      {{# if hasCustomInputs }}
        {{ crudName }}InsertOne: [
          X.ToModel({{ insertInputName }}Input, { field: "document"}),
          X.Validate({ field: "document"}),
          X.ToDocumentInsert({{ collectionClass }}),
          X.ToNovaByResultID({{ collectionClass }})
        ],
        {{ crudName }}UpdateOne: [
          X.ToModel({{ updateInputName }}Input, { field: "document"}),
          X.Validate({ field: "document"}),
          X.CheckDocumentExists({{ collectionClass }}),
          X.ToDocumentUpdateByID({{ collectionClass }}, null, ({ document }) => (
            {
              $set: document
            }
          )),
          X.ToNovaByResultID({{ collectionClass }})
        ],
      {{ else }}
        {{ crudName }}InsertOne: [
          X.ToDocumentInsert({{ collectionClass }}),
          X.ToNovaByResultID({{ collectionClass }})
        ],
        {{ crudName }}UpdateOne: [
          X.CheckDocumentExists({{ collectionClass }}),
          X.ToDocumentUpdateByID({{ collectionClass }}),
          X.ToNovaByResultID({{ collectionClass }})
        ],
      {{/ if }}
      {{ crudName }}DeleteOne: [
        X.CheckDocumentExists({{ collectionClass }}),
        X.ToDocumentDeleteByID({{ collectionClass }})
      ]
    }
  ],
  {{# if hasSubscriptions }}
    Subscription: {
      {{ crudName }}Subscription: {
        resolve: (payload) => payload,
        subscribe: [
          X.ToSubscription({{ collectionClass }}),
        ]
      },
      {{ crudName }}SubscriptionCount: {
        resolve: (payload) => payload,
        subscribe: [
          X.ToSubscriptionCount({{ collectionClass }}),
        ]
      },
    },
  {{/ if }}
} as IResolverMap;