import * as X from "@bluelibs/x-bundle";
import { IResolverMap } from "@bluelibs/graphql-bundle";
{{# if hasCustomInputs }}
  {{ inputsImportLine }}
{{/ if }}
{{ collectionImportLine }}
{{ crud }}
{{ crudOperations.count }}
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
      {{# if crudOperations.findOne }}
      {{ crudName }}FindOne: [
      X.ToNovaOne({{ collectionClass }})
      ],
      {{/ if }}
      {{# if crudOperations.find }}
      {{ crudName }}Find: [
      X.ToNova({{ collectionClass }})
      ],
      {{/ if }}
      {{# if crudOperations.count }}
      {{ crudName }}Count: [
      X.ToCollectionCount({{ collectionClass }})
      ]
      {{/ if }}
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
      {{# if crudOperations.insertOne }}
        {{ crudName }}InsertOne: [
          X.ToModel({{ insertInputName }}Input, { field: "document"}),
          X.Validate({ field: "document"}),
          X.ToDocumentInsert({{ collectionClass }}),
          X.ToNovaByResultID({{ collectionClass }})
        ],
        {{/ if }}
        {{# if crudOperations.updateOne }}
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
        {{/ if }}
      {{ else }}
      {{# if crudOperations.insertOne }}
        {{ crudName }}InsertOne: [
          X.ToDocumentInsert({{ collectionClass }}),
          X.ToNovaByResultID({{ collectionClass }})
        ],
        {{/ if }}
      {{# if crudOperations.updateOne }}
        {{ crudName }}UpdateOne: [
          X.CheckDocumentExists({{ collectionClass }}),
          X.ToDocumentUpdateByID({{ collectionClass }}),
          X.ToNovaByResultID({{ collectionClass }})
        ],
        {{/ if }}
      {{/ if }}
      {{# if crudOperations.deleteOne }}
      {{ crudName }}DeleteOne: [
        X.CheckDocumentExists({{ collectionClass }}),
        X.ToDocumentDeleteByID({{ collectionClass }})
      ]
      {{/ if }}
    }
  ],
  {{# if hasSubscriptions }}
    Subscription: {
      {{# if crudOperations.subscription }}
      {{ crudName }}Subscription: {
        resolve: (payload) => payload,
        subscribe: [
          X.ToSubscription({{ collectionClass }}),
        ]
      },
      {{/ if }}
    {{# if crudOperations.subscriptionCount }}
      {{ crudName }}SubscriptionCount: {
        resolve: (payload) => payload,
        subscribe: [
          X.ToSubscriptionCount({{ collectionClass }}),
        ]
      },
      {{/ if }}
    },
  {{/ if }}
} as IResolverMap;